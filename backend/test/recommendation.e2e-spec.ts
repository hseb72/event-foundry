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
 * Moteur de recommandation déterministe (EPIC 06 / ADR.09) : recommandations explicables, bascule
 * du mode « Surprends-moi », exclusion des refus, et contrôle d'accès.
 */
describe('Recommendation — moteur déterministe, explicable (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let ref: { magic: string; pokemon: string; category: string; municipality: string };
  const events: Record<string, string> = {};

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const db = prisma(app);
    const s = Date.now();
    const domain = await db.domain.create({ data: { name: `Dom R ${s}` } });
    const magic = await db.activity.create({ data: { name: `Magic R ${s}`, domainId: domain.id } });
    const pokemon = await db.activity.create({ data: { name: `Pokémon R ${s}`, domainId: domain.id } });
    const category = await db.category.create({ data: { name: `Cat R ${s}` } });
    const country = await db.country.create({ data: { name: `Pays R ${s}` } });
    const region = await db.region.create({ data: { name: `Reg R ${s}`, countryId: country.id } });
    const municipality = await db.municipality.create({ data: { name: `Ville R ${s}`, regionId: region.id } });
    ref = { magic: magic.id, pokemon: pokemon.id, category: category.id, municipality: municipality.id };

    await createUser(app, (organizerEmail = uniqueEmail('reco-org')), PASSWORD, ['Organizer']);
    await createUser(app, (explorerEmail = uniqueEmail('reco-ex')), PASSWORD, ['Explorer']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);

    // Habitude : l'explorer participe à un événement Magic (→ active activité/catégorie/commune).
    events.habit = await publish(ref.magic, 'Magic — habitude', '2026-08-01T10:00:00.000Z');
    await participate(events.habit);
    // Candidats : même catégorie/commune, mais activité fréquentée (Magic) vs nouvelle (Pokémon).
    events.magic = await publish(ref.magic, 'Magic — candidat', '2026-08-08T10:00:00.000Z');
    events.pokemon = await publish(ref.pokemon, 'Pokémon — candidat', '2026-08-15T10:00:00.000Z');
  });

  afterAll(async () => {
    await app.close();
  });

  let organizerEmail = '';
  let explorerEmail = '';

  it('classe l\'activité fréquentée en tête et explique la recommandation (mode normal)', async () => {
    const recos = await recommend(explorerToken, {});
    const magic = find(recos, events.magic);
    const pokemon = find(recos, events.pokemon);
    expect(magic).toBeTruthy();
    expect(pokemon).toBeTruthy();
    // L'événement de l'activité fréquentée prime, avec sa justification.
    expect(magic.score).toBeGreaterThan(pokemon.score);
    expect(magic.reasons.join(' ')).toContain('Activité que vous fréquentez');
    expect(pokemon.reasons).toContain('À découvrir');
    // L'événement déjà planifié (habitude) n'est jamais reproposé.
    expect(find(recos, events.habit)).toBeUndefined();
  });

  it('mode « Surprends-moi » : la nouveauté passe devant l\'habitude', async () => {
    const recos = await recommend(explorerToken, { surprise: 'true' });
    const pokemon = find(recos, events.pokemon);
    expect(pokemon).toBeTruthy();
    expect(pokemon.reasons.join(' ')).toContain('Nouvelle activité à explorer');
    // L'habitude ne prime plus : le candidat Magic passe sous la nouveauté (voire hors du haut du
    // classement) — inverse du mode normal, où Magic devançait Pokémon.
    const magic = find(recos, events.magic);
    expect(!magic || magic.score < pokemon.score).toBe(true);
  });

  it('est reproductible : deux appels identiques donnent les mêmes scores', async () => {
    const a = await recommend(explorerToken, {});
    const b = await recommend(explorerToken, {});
    const sa = find(a, events.magic).score;
    const sb = find(b, events.magic).score;
    expect(sa).toBe(sb);
  });

  it('un refus exclut déterministiquement l\'événement des recommandations suivantes', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/me/recommendations/${events.pokemon}/feedback`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .send({ action: 'REJECTED' })
      .expect(204);
    const recos = await recommend(explorerToken, {});
    expect(find(recos, events.pokemon)).toBeUndefined();
    // Le candidat non refusé reste proposé.
    expect(find(recos, events.magic)).toBeTruthy();
  });

  it('réserve les recommandations à la permission recommendation.view (403 pour Organizer)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/me/recommendations')
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(403);
  });

  async function publish(activityId: string, title: string, startsAt: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId, categoryIds: [ref.category], municipalityId: ref.municipality, title, startsAt })
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

  async function recommend(
    token: string,
    params: Record<string, string>,
  ): Promise<{ event: { id: string }; score: number; reasons: string[] }[]> {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/recommendations')
      .query({ take: '50', ...params })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body;
  }
});

function find(
  recos: { event: { id: string }; score: number; reasons: string[] }[],
  id: string,
): { event: { id: string }; score: number; reasons: string[] } {
  return recos.find((r) => r.event.id === id) as never;
}

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
