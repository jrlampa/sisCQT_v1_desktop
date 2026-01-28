import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import { prisma } from '../utils/db';

let mockVerifyToken: (token: string) => Promise<any>;

vi.mock('../utils/tokenUtils', () => ({
  verifyToken: (token: string) => mockVerifyToken(token),
}));

describe('Auth (claims) e Plano (Pro/Free) — regras críticas', () => {
  const prevEnv = { ...process.env };
  let app: Express;

  beforeAll(async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_MOCK_AUTH = 'false';
    process.env.RATE_LIMIT_DISABLED = 'true';
    process.env.ENABLE_ENGINE_WORKER = 'false';

    mockVerifyToken = vi.fn(async () => ({
      email: 'user@gmail.com',
      name: 'User',
      iss: 'accounts.google.com',
      aud: 'test',
    }));

    const [
      { authRoutes },
      { engineRoutes },
      { geminiRoutes },
      { errorHandler },
    ] = await Promise.all([
      import('../server/routes/authRoutes'),
      import('../server/routes/engineRoutes'),
      import('../server/routes/geminiRoutes'),
      import('../server/middlewares/errorHandler'),
    ]);

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api', engineRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use(errorHandler);
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  beforeEach(() => {
    // Default token (usuário Google não corporativo) para evitar vazamento entre testes.
    mockVerifyToken = vi.fn(async () => ({
      email: 'user@gmail.com',
      name: 'User',
      iss: 'accounts.google.com',
      aud: 'test',
    }));
    // @ts-ignore
    prisma.user.upsert?.mockReset?.();
  });

  it('deve retornar 401 quando faltam claims de utilizador (token inválido)', async () => {
    mockVerifyToken = vi.fn(async () => ({ iss: 'https://login.microsoftonline.com/common/v2.0' }));
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-sem-claims')
      .expect(401);

    expect(res.body).toMatchObject({
      success: false,
      error: 'Token inválido: faltam claims de utilizador.',
    });
  });

  it('deve retornar 403 quando email @im3brasil.com.br tenta autenticar via issuer Google', async () => {
    mockVerifyToken = vi.fn(async () => ({
      email: 'dev@im3brasil.com.br',
      iss: 'accounts.google.com',
      name: 'Dev',
    }));

    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u-im3',
      email: 'dev@im3brasil.com.br',
      name: 'Dev',
      plan: 'Enterprise',
      authProvider: 'ENTRA',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-google')
      .expect(403);

    expect(res.body).toMatchObject({ success: false });
    expect(String(res.body.error)).toContain('Use Entra ID');
  });

  it('POST /api/optimize deve retornar 402 para usuário Free (gate antes do Zod)', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u-free',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Free',
      authProvider: 'GOOGLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/optimize')
      .set('Authorization', 'Bearer token-free')
      .send({})
      .expect(402);

    expect(res.body).toMatchObject({ success: false });
    expect(String(res.body.error)).toContain('Otimização');
  });

  it('POST /api/optimize deve retornar 400 (Zod) para usuário Pro com payload inválido', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u-pro',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Pro',
      authProvider: 'GOOGLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/optimize')
      .set('Authorization', 'Bearer token-pro')
      .send({})
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Dados inválidos.' });
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('POST /api/gemini/ask deve retornar 402 para usuário Free (sem executar GeminiService)', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u-free',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Free',
      authProvider: 'GOOGLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/gemini/ask')
      .set('Authorization', 'Bearer token-free')
      .send({})
      .expect(402);

    expect(res.body).toMatchObject({ success: false });
    expect(String(res.body.error)).toContain('Theseus AI');
  });

  it('POST /api/gemini/ask deve retornar 400 para usuário Pro quando prompt é ausente', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u-pro',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Pro',
      authProvider: 'GOOGLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/gemini/ask')
      .set('Authorization', 'Bearer token-pro')
      .send({})
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Prompt é obrigatório.' });
  });
});

