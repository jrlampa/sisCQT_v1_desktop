import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

describe('Segurança: headers (Helmet) e CORS', () => {
  const prevEnv = { ...process.env };
  let app: any;

  beforeAll(async () => {
    vi.resetModules();
    process.env.VITEST = 'true';
    process.env.NODE_ENV = 'test';
    process.env.RATE_LIMIT_DISABLED = 'true';

    const mod = await import('../server');
    app = mod.default;
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  it('GET /api/healthz deve incluir headers de hardening e CORS default em dev/test', async () => {
    const res = await request(app).get('/api/healthz').expect(200);

    // Helmet (hardening mínimo)
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBeDefined();

    // CSP allowlist mínima (MSAL/Google)
    expect(String(res.headers['content-security-policy'] || '')).toContain('script-src');
    expect(String(res.headers['content-security-policy'] || '')).toContain('https://accounts.google.com');

    // CORP (compat com mapas/assets cross-origin no cenário atual)
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');

    // CORS em não-prod: sem Origin -> '*'
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('deve espelhar Origin e setar Vary em não-produção', async () => {
    const res = await request(app)
      .get('/api/healthz')
      .set('Origin', 'https://example.com')
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
    expect(String(res.headers.vary || '')).toContain('Origin');
  });

  it('OPTIONS (preflight) deve retornar 204 com Access-Control-Allow-*', async () => {
    const res = await request(app)
      .options('/api/healthz')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(res.headers['access-control-allow-origin']).toBe('https://example.com');
    expect(String(res.headers['access-control-allow-methods'] || '')).toContain('GET');
    expect(String(res.headers['access-control-allow-headers'] || '')).toContain('Content-Type');
  });
});

