import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import { prisma } from '../utils/db';

describe('LGPD (privacy/export/delete) — evidências e regressões', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = 'dev-token-im3';
  });

  it('GET /api/privacy/export deve setar headers de download (Content-Disposition)', async () => {
    // @ts-ignore
    prisma.subscription.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/privacy/export')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(String(res.headers['content-type'] || '')).toContain('application/json');
    expect(String(res.headers['content-disposition'] || '')).toContain('attachment;');
    expect(String(res.headers['content-disposition'] || '')).toContain('lgpd_export_');
    expect(res.body).toHaveProperty('exportedAt');
    expect(res.body).toHaveProperty('user.id');
  });

  it('POST /api/privacy/delete deve ser idempotente quando Prisma retorna P2025', async () => {
    const prismaP2025 = Object.assign(new Error('Record not found'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2025',
    });

    // @ts-ignore
    prisma.$transaction.mockRejectedValueOnce(prismaP2025);

    const res = await request(app)
      .post('/api/privacy/delete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ confirm: true })
      .expect(200);

    expect(res.body).toMatchObject({ success: true });
  });
});

