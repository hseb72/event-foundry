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

/**
 * Domaine Notifications (EPIC 08) : une transition d'un Event notifie ses participants (canal
 * interne), sans notifier l'acteur ; consultation, comptage non lus, marquage lu et suppression.
 */
describe('Notifications — transitions d\'événement → participants (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let activityId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const db = prisma(app);
    const s = Date.now();
    const domain = await db.domain.create({ data: { name: `Dom N ${s}` } });
    const activity = await db.activity.create({ data: { name: `Act N ${s}`, domainId: domain.id } });
    activityId = activity.id;

    await createUser(app, (organizerEmail = uniqueEmail('notif-org')), PASSWORD, ['Organizer']);
    await createUser(app, (explorerEmail = uniqueEmail('notif-ex')), PASSWORD, ['Explorer']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  let organizerEmail = '';
  let explorerEmail = '';

  it('notifie le participant quand son événement est archivé (et pas l\'organisateur)', async () => {
    const eventId = await publish('Tournoi à archiver', '2027-06-01T10:00:00.000Z');
    await participate(eventId);

    await request(app.getHttpServer())
      .post(`/api/v1/events/${eventId}/archive`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    // Le participant reçoit une notification interne non lue, avec rebond vers l'événement.
    const notif = (await list(explorerToken)).find((n) => n.eventId === eventId)!;
    expect(notif).toBeTruthy();
    expect(notif.type).toBe('EVENT_ARCHIVED');
    expect(notif.status).toBe('UNREAD');
    expect(notif.title).toContain('archivé');

    // L'organisateur (acteur, non participant) n'est pas notifié pour cet événement.
    expect((await list(organizerToken)).some((n) => n.eventId === eventId)).toBe(false);
  });

  it('compte les non lues, marque comme lu, puis supprime', async () => {
    const eventId = await publish('Tournoi à dépublier', '2027-06-08T10:00:00.000Z');
    await participate(eventId);
    await request(app.getHttpServer())
      .post(`/api/v1/events/${eventId}/unpublish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    const before = await unreadCount(explorerToken);
    expect(before).toBeGreaterThanOrEqual(1);
    const notif = (await list(explorerToken)).find((n) => n.eventId === eventId)!;
    expect(notif.type).toBe('EVENT_UNPUBLISHED');

    await request(app.getHttpServer())
      .post(`/api/v1/me/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(204);
    expect(await unreadCount(explorerToken)).toBe(before - 1);

    await request(app.getHttpServer())
      .delete(`/api/v1/me/notifications/${notif.id}`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(204);
    expect((await list(explorerToken)).some((n) => n.id === notif.id)).toBe(false);
  });

  it('marque toutes les notifications comme lues', async () => {
    const eventId = await publish('Tournoi archivé bis', '2027-06-15T10:00:00.000Z');
    await participate(eventId);
    await request(app.getHttpServer())
      .post(`/api/v1/events/${eventId}/archive`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/me/notifications/read-all')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(204);
    expect(await unreadCount(explorerToken)).toBe(0);
  });

  async function publish(title: string, startsAt: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId, title, startsAt })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/events/${created.body.id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    return created.body.id as string;
  }

  async function participate(eventId: string): Promise<void> {
    await request(app.getHttpServer())
      .put(`/api/v1/events/${eventId}/participation`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .send({ interested: true, reservationStatus: 'NONE', paymentStatus: 'NONE' })
      .expect(200);
  }

  async function list(token: string): Promise<{ id: string; eventId: string; type: string; title: string; status: string }[]> {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body;
  }

  async function unreadCount(token: string): Promise<number> {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body.count as number;
  }
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
