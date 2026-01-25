import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('GIS endpoints — validações (Zod)', () => {
  let authToken: string;

  beforeAll(() => {
    // Mock auth já está habilitado em tests/setup.ts
    authToken = 'dev-token-im3';
  });

  it('deve retornar 400 quando lat está fora do range', async () => {
    const res = await request(app)
      .post('/api/gis/nodes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ lat: 91, lng: 0, type: 'TRAFO', name: 'Nó' })
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Dados inválidos.' });
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('deve retornar 400 quando lng está fora do range', async () => {
    const res = await request(app)
      .post('/api/gis/nodes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ lat: 0, lng: 181, type: 'TRAFO', name: 'Nó' })
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Dados inválidos.' });
  });

  it('deve retornar 400 quando type é inválido', async () => {
    const res = await request(app)
      .post('/api/gis/nodes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ lat: 0, lng: 0, type: 'INVALIDO', name: 'Nó' })
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Dados inválidos.' });
  });

  it('deve retornar 400 quando name é vazio', async () => {
    const res = await request(app)
      .post('/api/gis/nodes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ lat: 0, lng: 0, type: 'TRAFO', name: '' })
      .expect(400);

    expect(res.body).toMatchObject({ success: false, error: 'Dados inválidos.' });
  });
});

