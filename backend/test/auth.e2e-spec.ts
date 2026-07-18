import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, ensureRoles, uniqueEmail } from './create-app';

describe('Auth (E2E)', () => {
  let app: INestApplication;
  const email = uniqueEmail('auth');
  const password = 'un-mot-de-passe-solide';

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('inscrit un utilisateur et renvoie des jetons', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'Testeur E2E' })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.tokenType).toBe('Bearer');
  });

  it('refuse un mot de passe trop court (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: uniqueEmail('short'), password: 'court', displayName: 'X' })
      .expect(400);
  });

  it('connecte avec les bons identifiants et rejette les mauvais', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'mauvais-mot-de-passe' })
      .expect(401);
  });

  it('protège /users/me (401 sans jeton, profil avec jeton)', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const me = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(me.body.email).toBe(email);
    expect(me.body.roles).toContain('USER');
  });

  it('rafraîchit les jetons', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
  });
});
