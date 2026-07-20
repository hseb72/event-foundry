import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, createUser, ensureIdentitySeed, ensureRoles, uniqueEmail } from './create-app';

const PASSWORD = 'un-mot-de-passe-solide';

/** Référentiels géographiques Country → Region → Municipality (CRUD, hiérarchie, RBAC). */
describe('Reference Data — Géographie (E2E)', () => {
  let app: INestApplication;
  let operatorToken: string;
  let explorerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const operatorEmail = uniqueEmail('geo-op');
    const explorerEmail = uniqueEmail('geo-ex');
    await createUser(app, operatorEmail, PASSWORD, ['Platform Operator']);
    await createUser(app, explorerEmail, PASSWORD, ['Explorer']);
    operatorToken = await login(app, operatorEmail);
    explorerToken = await login(app, explorerEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  it('crée la hiérarchie Country → Region → Municipality', async () => {
    const suffix = Date.now();
    const country = await post(app, operatorToken, '/api/v1/countries', { name: `Pays ${suffix}` }).expect(201);

    const region = await post(app, operatorToken, '/api/v1/regions', {
      name: `Région ${suffix}`,
      countryId: country.body.id,
    }).expect(201);
    expect(region.body.countryId).toBe(country.body.id);

    const city = await post(app, operatorToken, '/api/v1/municipalities', {
      name: `Ville ${suffix}`,
      regionId: region.body.id,
      postalCode: '00000',
    }).expect(201);
    expect(city.body.regionId).toBe(region.body.id);
    expect(city.body.postalCode).toBe('00000');

    // Filtrage par parent
    const regionsOfCountry = await request(app.getHttpServer())
      .get(`/api/v1/regions?countryId=${country.body.id}`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    expect(regionsOfCountry.body.map((r: { id: string }) => r.id)).toContain(region.body.id);

    // Localisation V3 (chantier §8.1) : résolution pays + code postal → commune(s), région dérivée.
    const resolved = await request(app.getHttpServer())
      .get(`/api/v1/municipalities/resolve?countryId=${country.body.id}&postalCode=00000`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    const match = resolved.body.find((m: { id: string }) => m.id === city.body.id);
    expect(match).toBeDefined();
    expect(match.regionName).toBe(region.body.name);
    expect(match.countryId).toBe(country.body.id);

    // Vue géographique d'une commune (préremplissage édition).
    const geo = await request(app.getHttpServer())
      .get(`/api/v1/municipalities/${city.body.id}/geo`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    expect(geo.body.regionName).toBe(region.body.name);
    expect(geo.body.postalCode).toBe('00000');
  });

  it('rejette une Region rattachée à un Country inexistant (404)', async () => {
    await post(app, operatorToken, '/api/v1/regions', {
      name: 'Orpheline',
      countryId: '00000000-0000-0000-0000-000000000000',
    }).expect(404);
  });

  it("réserve l'écriture à la permission reference.manage (403 pour Explorer)", async () => {
    await post(app, explorerToken, '/api/v1/countries', { name: 'Interdit' }).expect(403);
    // La lecture reste ouverte à tout utilisateur authentifié
    await request(app.getHttpServer())
      .get('/api/v1/countries')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
  });
});

function post(app: INestApplication, token: string, url: string, body: object) {
  return request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`).send(body);
}

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
