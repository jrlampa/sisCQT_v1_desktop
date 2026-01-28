import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';

describe('Security / Compliance', () => {
  const prevEnv = { ...process.env };

  afterAll(() => {
    process.env = prevEnv;
  });

  describe('Helmet (headers)', () => {
    let app: any;

    beforeAll(async () => {
      vi.resetModules();
      process.env.VITEST = 'true';
      process.env.NODE_ENV = 'test';
      process.env.RATE_LIMIT_DISABLED = 'true';
      process.env.SECURITY_AUDIT_ENABLED = 'false';

      const mod = await import('../server');
      app = mod.default;
    });

    it('deve setar headers básicos de hardening', async () => {
      const res = await request(app).get('/api/healthz').expect(200);

      // Helmet: headers estáveis
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();

      // App: headers de compatibilidade/cross-origin definidos em middleware próprio
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
  });

  describe('Rate limit + evidência (audit trail)', () => {
    let app: any;
    const auditPath = path.resolve('test-results', 'security-audit.ndjson');

    beforeAll(async () => {
      vi.resetModules();

      // Limpa evidências anteriores
      try {
        fs.rmSync(auditPath, { force: true });
      } catch {
        // ignore
      }

      process.env.VITEST = 'true';
      process.env.NODE_ENV = 'test';
      process.env.ENABLE_MOCK_AUTH = 'true';
      process.env.RATE_LIMIT_DISABLED = 'false';
      process.env.RATE_LIMIT_WINDOW_MS = '60000';
      process.env.RATE_LIMIT_MAX = '2';

      process.env.SECURITY_AUDIT_ENABLED = 'true';
      process.env.SECURITY_AUDIT_PATH = auditPath;

      const mod = await import('../server');
      app = mod.default;
    });

    it('deve gerar audit trail para 401 e 429 (arquivo NDJSON)', async () => {
      // 401: rota protegida sem token
      await request(app).get('/api/projects').expect(401);

      // 429: rate limit (considera o 401 anterior como 1 hit em /api)
      await request(app).get('/api/healthz').expect(200);
      const rateLimited = await request(app).get('/api/healthz').expect(429);
      expect(rateLimited.body).toMatchObject({ success: false, error: 'Muitas requisições. Tente novamente em instantes.' });

      const raw = fs.readFileSync(auditPath, 'utf8');
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
      expect(lines.length).toBeGreaterThanOrEqual(2);

      const events = lines.map((l) => JSON.parse(l));
      const statuses = new Set(events.map((e: any) => e.status));
      expect(statuses.has(401)).toBe(true);
      expect(statuses.has(429)).toBe(true);

      // Não deve logar token; e deve conter metadados mínimos
      for (const e of events) {
        expect(e).toHaveProperty('ts');
        expect(e).toHaveProperty('kind', 'security');
        expect(e).toHaveProperty('method');
        expect(e).toHaveProperty('path');
        expect(JSON.stringify(e)).not.toContain('Authorization');
      }
    });
  });

  describe('Validação de token (inválido/expirado/claims)', () => {
    let app: any;
    let verifyTokenMock: any;

    beforeAll(async () => {
      vi.resetModules();

      process.env.VITEST = 'true';
      process.env.NODE_ENV = 'test';
      process.env.RATE_LIMIT_DISABLED = 'true';
      process.env.SECURITY_AUDIT_ENABLED = 'false';

      // Desliga mock auth para forçar a execução de verifyToken()
      process.env.ENABLE_MOCK_AUTH = 'false';

      // Mock do tokenUtils precisa manter assertProdAuthConfig (usado no boot).
      vi.doMock('../utils/tokenUtils', async () => {
        const actual = await vi.importActual<any>('../utils/tokenUtils');
        return {
          ...actual,
          verifyToken: vi.fn(),
        };
      });

      const tokenUtils = await import('../utils/tokenUtils');
      verifyTokenMock = (tokenUtils as any).verifyToken;

      const mod = await import('../server');
      app = mod.default;
    });

    it('deve retornar 401 quando token está expirado', async () => {
      verifyTokenMock.mockRejectedValueOnce(Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' }));

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(res.body).toMatchObject({
        success: false,
        error: 'Falha na autenticação: O token pode ser inválido ou expirado.',
      });
    });

    it('deve retornar 401 quando faltam claims de utilizador', async () => {
      verifyTokenMock.mockResolvedValueOnce({
        iss: 'https://login.microsoftonline.com/common/v2.0',
        aud: 'test-audience',
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer token-sem-claims')
        .expect(401);

      expect(res.body).toMatchObject({
        success: false,
        error: 'Token inválido: faltam claims de utilizador.',
      });
    });

    it('deve retornar 403 quando email @im3brasil.com.br vem de issuer Google', async () => {
      verifyTokenMock.mockResolvedValueOnce({
        email: 'alguem@im3brasil.com.br',
        iss: 'accounts.google.com',
        aud: 'test',
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer token-google-im3')
        .expect(403);

      expect(res.body).toMatchObject({
        success: false,
        error: 'Use Entra ID para contas @im3brasil.com.br.',
      });
    });
  });
});

