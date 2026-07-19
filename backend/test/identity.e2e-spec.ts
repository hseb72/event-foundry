import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createUser, ensureIdentitySeed, uniqueEmail } from './create-app';

const PASSWORD = 'un-mot-de-passe-solide';

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}

describe('Identity (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureIdentitySeed(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('inscrit un Explorer par défaut et expose son identité effective', async () => {
    const email = uniqueEmail('explorer');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, displayName: 'Exploratrice' })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get('/api/v1/identity/me')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .expect(200);

    expect(me.body.roles).toContain('Explorer');
    expect(me.body.experiences).toEqual(['EXPLORER']);
    expect(me.body.activeExperience).toBe('EXPLORER');
    expect(me.body.permissions).toContain('planning.manage');
    expect(me.body.permissions).not.toContain('user.manage');
  });

  it('met à jour le profil (nom affiché)', async () => {
    const email = uniqueEmail('profile');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, displayName: 'Avant' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/identity/me/profile')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ displayName: 'Après', preferences: { theme: 'dark' } })
      .expect(200);

    expect(updated.body.displayName).toBe('Après');
  });

  it("refuse de basculer vers une expérience non disponible (409)", async () => {
    const email = uniqueEmail('exp');
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: PASSWORD, displayName: 'Exp' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/api/v1/identity/me/experience')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ experience: 'OPERATOR' })
      .expect(409);
  });

  it("interdit les routes d'administration sans la permission user.manage (403)", async () => {
    const email = uniqueEmail('noperm');
    await createUser(app, email, PASSWORD, ['Explorer']);
    const token = await login(app, email);

    await request(app.getHttpServer())
      .get('/api/v1/identity/organizations')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('un Operator administre organisations, membres et rôles (contexte org-scopé)', async () => {
    const operatorEmail = uniqueEmail('operator');
    await createUser(app, operatorEmail, PASSWORD, ['Explorer', 'Platform Operator']);
    const operatorToken = await login(app, operatorEmail);

    // Accès admin autorisé
    await request(app.getHttpServer())
      .get('/api/v1/identity/organizations')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    // Création d'une organisation
    const slug = `org-${Date.now()}`;
    const created = await request(app.getHttpServer())
      .post('/api/v1/identity/organizations')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ name: 'Boutique Test', slug })
      .expect(201);
    const orgId = created.body.id as string;
    expect(orgId).toEqual(expect.any(String));

    // Un membre Explorer, rattaché comme Organizer à l'organisation
    const memberEmail = uniqueEmail('member');
    const member = await createUser(app, memberEmail, PASSWORD, ['Explorer']);
    await request(app.getHttpServer())
      .post(`/api/v1/identity/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ userId: member.id, role: 'Organizer' })
      .expect(204);

    // Le membre voit désormais l'organisation et l'expérience Organizer
    const memberToken = await login(app, memberEmail);
    const memberMe = await request(app.getHttpServer())
      .get('/api/v1/identity/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(memberMe.body.experiences).toContain('ORGANIZER');
    expect(memberMe.body.organizations.map((o: { id: string }) => o.id)).toContain(orgId);

    // Affecter un rôle d'ORGANISATION comme rôle plateforme est refusé (422)
    await request(app.getHttpServer())
      .post(`/api/v1/identity/users/${member.id}/roles`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ role: 'Organizer' })
      .expect(422);
  });
});
