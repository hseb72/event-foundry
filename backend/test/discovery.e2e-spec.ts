import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  createUser,
  ensureIdentitySeed,
  ensureRoles,
  prisma,
  uniqueEmail,
} from './create-app';

const PASSWORD = 'un-mot-de-passe-solide';

describe('Discovery — facettes, surprise, tri (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let ref: { activityId: string; categoryId: string; municipalityId: string; tagId: string };

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const db = prisma(app);
    const s = Date.now();
    const domain = await db.domain.create({ data: { name: `Dom D ${s}` } });
    const activity = await db.activity.create({ data: { name: `Act D ${s}`, domainId: domain.id } });
    const category = await db.category.create({ data: { name: `Cat D ${s}` } });
    const country = await db.country.create({ data: { name: `Pays D ${s}` } });
    const region = await db.region.create({ data: { name: `Reg D ${s}`, countryId: country.id } });
    const municipality = await db.municipality.create({ data: { name: `Ville D ${s}`, regionId: region.id } });
    const tag = await db.tag.create({ data: { name: `Tag D ${s}` } });
    ref = { activityId: activity.id, categoryId: category.id, municipalityId: municipality.id, tagId: tag.id };

    await createUser(app, (organizerEmail = uniqueEmail('disc-org')), PASSWORD, ['Organizer']);
    await createUser(app, (explorerEmail = uniqueEmail('disc-ex')), PASSWORD, ['Explorer']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);

    // Deux événements publiés partageant catégorie / tag / commune (fraîchement créés → compte = 2)
    await publish('Zeta — dernier alpha', '2027-01-10T10:00:00.000Z');
    await publish('Alpha — premier alpha', '2027-01-20T10:00:00.000Z');
  });

  afterAll(async () => {
    await app.close();
  });

  let organizerEmail = '';
  let explorerEmail = '';

  it('expose des facettes avec les comptes par référentiel', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/discovery/facets')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);

    const cat = (res.body.categories as { id: string; count: number }[]).find((c) => c.id === ref.categoryId);
    const tag = (res.body.tags as { id: string; count: number }[]).find((t) => t.id === ref.tagId);
    const mun = (res.body.municipalities as { id: string }[]).find((m) => m.id === ref.municipalityId);
    expect(cat?.count).toBe(2);
    expect(tag?.count).toBe(2);
    expect(mun).toBeTruthy();
  });

  it('« Surprends-moi » retourne des événements publiés (borné)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/discovery/surprise?take=3')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(3);
    for (const event of res.body) {
      expect(event.status).toBe('PUBLISHED');
    }
  });

  it('trie la recherche par titre (alphabétique)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/events?categoryId=${ref.categoryId}&sort=title`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    const titles = (res.body.items as { title: string }[]).map((e) => e.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    expect(titles[0]).toContain('Alpha');
  });

  async function publish(title: string, startsAt: string): Promise<void> {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: ref.activityId,
        categoryIds: [ref.categoryId],
        municipalityId: ref.municipalityId,
        tagIds: [ref.tagId],
        title,
        startsAt,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/events/${created.body.id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
  }
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
