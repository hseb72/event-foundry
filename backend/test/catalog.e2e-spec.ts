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

interface Refs {
  activityId: string;
  categoryId: string;
  municipalityId: string;
  tagId: string;
}

/** Seed direct des référentiels nécessaires à un Event enrichi (domaine/activité, catégorie, géo, tag). */
async function seedRefs(app: INestApplication): Promise<Refs> {
  const db = prisma(app);
  const suffix = Date.now();
  const domain = await db.domain.create({ data: { name: `Dom ${suffix}` } });
  const activity = await db.activity.create({ data: { name: `Act ${suffix}`, domainId: domain.id } });
  const category = await db.category.create({ data: { name: `Cat ${suffix}` } });
  const country = await db.country.create({ data: { name: `Pays ${suffix}` } });
  const region = await db.region.create({ data: { name: `Reg ${suffix}`, countryId: country.id } });
  const municipality = await db.municipality.create({
    data: { name: `Ville ${suffix}`, regionId: region.id, postalCode: '12345' },
  });
  const tag = await db.tag.create({ data: { name: `Tag ${suffix}` } });
  return {
    activityId: activity.id,
    categoryId: category.id,
    municipalityId: municipality.id,
    tagId: tag.id,
  };
}

describe('Catalog — Event enrichi (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let refs: Refs;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);
    refs = await seedRefs(app);

    const organizerEmail = uniqueEmail('cat-org');
    const explorerEmail = uniqueEmail('cat-ex');
    await createUser(app, organizerEmail, PASSWORD, ['Organizer']);
    await createUser(app, explorerEmail, PASSWORD, ['Explorer']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  it('crée un Event avec catégorie, commune et tags, puis l’archive et le restaure', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        categoryId: refs.categoryId,
        municipalityId: refs.municipalityId,
        tagIds: [refs.tagId],
        title: 'Grand tournoi',
        startsAt: '2026-09-01T10:00:00.000Z',
      })
      .expect(201);

    expect(created.body.status).toBe('PUBLISHED');
    expect(created.body.category).toBeTruthy();
    expect(created.body.municipality).toBeTruthy();
    expect(created.body.region).toBeTruthy();
    expect(created.body.country).toBeTruthy();
    expect(created.body.tags).toHaveLength(1);

    const id = created.body.id as string;

    const archived = await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/archive`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(archived.body.status).toBe('ARCHIVED');

    const restored = await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/restore`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(restored.body.status).toBe('PUBLISHED');
  });

  it('rejette un tag inexistant (422)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        tagIds: ['ffffffff-ffff-4fff-8fff-ffffffffffff'],
        title: 'Tournoi tag KO',
        startsAt: '2026-09-01T10:00:00.000Z',
      })
      .expect(422);
  });

  it('réserve la création à la permission event.create (403 pour Explorer)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${explorerToken}`)
      .send({ activityId: refs.activityId, title: 'Interdit', startsAt: '2026-09-01T10:00:00.000Z' })
      .expect(403);
  });
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
