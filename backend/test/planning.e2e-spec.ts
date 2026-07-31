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

describe('Planning — détection de conflits (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let activityId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const db = prisma(app);
    const suffix = Date.now();
    const domain = await db.domain.create({ data: { name: `Dom P ${suffix}` } });
    const activity = await db.activity.create({ data: { name: `Act P ${suffix}`, domainId: domain.id } });
    activityId = activity.id;

    const organizerEmail = uniqueEmail('plan-org');
    const explorerEmail = uniqueEmail('plan-ex');
    await createUser(app, organizerEmail, PASSWORD, ['Organizer']);
    await createUser(app, explorerEmail, PASSWORD, ['Explorer']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  it('signale les conflits d’horaire entre entrées du planning', async () => {
    // Deux événements qui se chevauchent + un événement disjoint (publiés par l'organisateur)
    const a = await publishEvent('Concert A', '2026-09-05T10:00:00.000Z', '2026-09-05T12:00:00.000Z');
    const b = await publishEvent('Concert B', '2026-09-05T11:00:00.000Z', '2026-09-05T13:00:00.000Z');
    const c = await publishEvent('Concert C', '2026-09-06T10:00:00.000Z', '2026-09-06T11:00:00.000Z');

    // L'explorer les ajoute à son planning (participation)
    for (const id of [a, b, c]) {
      await request(app.getHttpServer())
        .put(`/api/v1/events/${id}/participation`)
        .set('Authorization', `Bearer ${explorerToken}`)
        .send({ interested: true })
        .expect(200);
    }

    const planning = await request(app.getHttpServer())
      .get('/api/v1/me/planning')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);

    const byId = new Map<string, string[]>(
      (planning.body as { event: { id: string }; conflictsWith: string[] }[]).map((entry) => [
        entry.event.id,
        entry.conflictsWith,
      ]),
    );
    expect(byId.get(a)).toEqual([b]);
    expect(byId.get(b)).toEqual([a]);
    expect(byId.get(c)).toEqual([]);
  });

  it('réserve le planning à la permission planning.manage (403 pour Organizer seul)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/me/planning')
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(403);
  });

  async function publishEvent(title: string, startsAt: string, endsAt: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId, title, startsAt, endsAt })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    return id;
  }
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
