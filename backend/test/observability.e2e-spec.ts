import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './create-app';

/** Sondes de santé, métriques Prometheus et propagation du correlationId (EPIC 13). */
describe('Observabilité (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('liveness répond sans authentification', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('readiness vérifie PostgreSQL et Redis', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.dependencies.database.status).toBe('up');
    expect(res.body.dependencies.redis.status).toBe('up');
  });

  it('expose les métriques Prometheus', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/metrics').expect(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });

  it('renvoie un correlationId et respecte celui fourni', async () => {
    const generated = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(generated.headers['x-correlation-id']).toEqual(expect.any(String));
    expect(generated.headers['x-correlation-id'].length).toBeGreaterThan(0);

    const provided = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-correlation-id', 'trace-abc-123')
      .expect(200);
    expect(provided.headers['x-correlation-id']).toBe('trace-abc-123');
  });
});
