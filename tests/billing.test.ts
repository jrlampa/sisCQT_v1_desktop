import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Express } from 'express';
import { prisma } from '../utils/db';

let mockVerifyToken: (token: string) => Promise<any>;
let stripeMock: any;

vi.mock('../utils/tokenUtils', () => ({
  verifyToken: (token: string) => mockVerifyToken(token),
}));

vi.mock('../services/stripeService', () => ({
  getStripe: () => stripeMock,
  getAppBaseUrl: () => 'https://app.example',
  getStripePriceIdPro: () => 'price_pro_123',
}));

describe('Billing routes (unit/integration)', () => {
  const prevEnv = { ...process.env };
  let app: Express;

  beforeAll(async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_MOCK_AUTH = 'false';
    process.env.RATE_LIMIT_DISABLED = 'true';

    // Defaults (podem ser sobrescritos por teste)
    mockVerifyToken = vi.fn(async () => ({
      email: 'user@gmail.com',
      name: 'User',
      iss: 'accounts.google.com',
      aud: 'test',
    }));

    stripeMock = {
      customers: {
        create: vi.fn(async () => ({ id: 'cus_123' })),
      },
      checkout: {
        sessions: {
          create: vi.fn(async () => ({ url: 'https://checkout.example/session' })),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(async () => ({ url: 'https://portal.example/session' })),
        },
      },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          status: 'active',
          items: { data: [{ price: { id: 'price_pro_123' } }] },
        })),
        cancel: vi.fn(async () => ({})),
      },
      webhooks: {
        constructEvent: vi.fn((_raw: Buffer, _sig: string, _secret: string) => ({
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: { userId: 'u1' },
              subscription: 'sub_1',
              customer: 'cus_1',
            },
          },
        })),
      },
    };

    const [{ billingRoutes }, { errorHandler }] = await Promise.all([
      import('../server/routes/billingRoutes'),
      import('../server/middlewares/errorHandler'),
    ]);

    app = express();
    app.use(express.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl === '/api/billing/webhook') {
          req.rawBody = buf;
        }
      },
    }));
    app.use('/api/billing', billingRoutes);
    app.use(errorHandler);
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  beforeEach(() => {
    // @ts-ignore
    prisma.user.upsert?.mockReset?.();
    // @ts-ignore
    prisma.user.update?.mockReset?.();
    // @ts-ignore
    prisma.subscription.findFirst?.mockReset?.();
    // @ts-ignore
    prisma.subscription.findUnique?.mockReset?.();
    // @ts-ignore
    prisma.subscription.update?.mockReset?.();
    // @ts-ignore
    prisma.subscription.upsert?.mockReset?.();
  });

  it('GET /api/billing/status deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/billing/status');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, error: 'Token não fornecido' });
  });

  it('GET /api/billing/status deve retornar plan/subscription quando autenticado', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Free',
      authProvider: 'GOOGLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // @ts-ignore
    prisma.subscription.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/billing/status')
      .set('Authorization', 'Bearer token-1')
      .expect(200);

    expect(res.body).toMatchObject({
      plan: 'Free',
      authProvider: 'GOOGLE',
      subscription: null,
    });
  });

  it('POST /api/billing/checkout deve criar customer/session e retornar url', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Free',
      authProvider: 'GOOGLE',
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // @ts-ignore
    prisma.user.update.mockResolvedValueOnce({ id: 'u1', stripeCustomerId: 'cus_123' });

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer token-1')
      .send({})
      .expect(200);

    expect(stripeMock.customers.create).toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalled();
    expect(res.body).toMatchObject({ url: 'https://checkout.example/session' });
  });

  it('POST /api/billing/portal deve retornar 400 quando stripeCustomerId está ausente', async () => {
    // @ts-ignore
    prisma.user.upsert.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@gmail.com',
      name: 'User',
      plan: 'Free',
      authProvider: 'GOOGLE',
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/billing/portal')
      .set('Authorization', 'Bearer token-1')
      .send({})
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Cliente Stripe não encontrado para este usuário.' });
  });

  it('POST /api/billing/checkout deve retornar 400 para conta corporativa (IM3/Enterprise)', async () => {
    mockVerifyToken = vi.fn(async () => ({
      email: 'dev@im3brasil.com.br',
      name: 'Dev',
      iss: 'https://login.microsoftonline.com/common/v2.0',
      aud: 'test',
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
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer token-entra')
      .send({})
      .expect(400);

    expect(res.body).toMatchObject({ success: false });
    expect(String(res.body.error)).toContain('Conta corporativa');
  });

  it('POST /api/billing/webhook deve retornar 400 sem stripe-signature', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .send({ hello: 'world' })
      .expect(400);
    expect(res.body).toMatchObject({ success: false, error: 'stripe-signature ausente' });
  });

  it('POST /api/billing/webhook deve retornar 500 quando STRIPE_WEBHOOK_SECRET não está configurado', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = '';
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'sig')
      .send({ hello: 'world' })
      .expect(500);
    expect(res.body).toMatchObject({ success: false, error: 'STRIPE_WEBHOOK_SECRET não configurado' });
  });

  it('POST /api/billing/webhook (checkout.session.completed) deve persistir subscription e plano', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';

    // @ts-ignore
    prisma.subscription.upsert.mockResolvedValueOnce({ id: 'sub-db-1' });
    // @ts-ignore
    prisma.user.update.mockResolvedValueOnce({ id: 'u1', plan: 'Pro' });

    const res = await request(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'sig')
      .send({ hello: 'world' })
      .expect(200);

    expect(res.body).toMatchObject({ received: true });
    expect(stripeMock.webhooks.constructEvent).toHaveBeenCalled();
    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_1');
    // @ts-ignore
    expect(prisma.subscription.upsert).toHaveBeenCalled();
    // @ts-ignore
    expect(prisma.user.update).toHaveBeenCalled();
  });
});

