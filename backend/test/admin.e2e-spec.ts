import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createUser, ensureIdentitySeed, ensureRoles, uniqueEmail } from './create-app';

/** RBAC des référentiels et garde-fous d'administration des utilisateurs. */
describe('Administration (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;

  const password = 'un-mot-de-passe-solide';
  const adminEmail = uniqueEmail('admin');
  const userEmail = uniqueEmail('user');

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    // L'« admin » porte le rôle Platform Operator (permissions reference.manage / user.manage)
    // + le rôle legacy ADMIN (garde-fou anti-verrouillage de son propre compte).
    adminId = (await createUser(app, adminEmail, password, ['ADMIN', 'Platform Operator'])).id;
    userId = (await createUser(app, userEmail, password, ['USER'])).id;

    adminToken = await login(app, adminEmail, password);
    userToken = await login(app, userEmail, password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('un ADMIN crée un référentiel, un USER ne le peut pas', async () => {
    const name = `Domaine E2E ${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/api/v1/domains')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name })
      .expect(201);
    expect(created.body.name).toBe(name);

    await request(app.getHttpServer())
      .post('/api/v1/domains')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Interdit' })
      .expect(403);

    const list = await request(app.getHttpServer())
      .get('/api/v1/domains')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(list.body.map((d: { name: string }) => d.name)).toContain(name);
  });

  it('valide les entrées (nom manquant → 400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/domains')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400);
  });

  it('un ADMIN promeut un utilisateur mais ne peut pas se retirer ADMIN', async () => {
    const promoted = await request(app.getHttpServer())
      .put(`/api/v1/users/${userId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['USER', 'ADMIN'] })
      .expect(200);
    expect(promoted.body.roles).toEqual(expect.arrayContaining(['USER', 'ADMIN']));

    // Anti-verrouillage : retrait de son propre ADMIN interdit (409).
    await request(app.getHttpServer())
      .put(`/api/v1/users/${adminId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['USER'] })
      .expect(409);
  });

  it('réserve la liste des utilisateurs aux ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});

async function login(app: INestApplication, email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.accessToken;
}
