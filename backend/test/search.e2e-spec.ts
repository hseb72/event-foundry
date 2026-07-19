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
 * Domaine Search (TSPEC.09) : indexation à la publication, recherche plein texte pondérée,
 * filtres, facettes contextuelles, tri, retrait de l'index au retrait de la diffusion, et
 * reconstruction réservée à la supervision technique.
 */
describe('Search — index plein texte, facettes, reconstruction (E2E)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let explorerToken: string;
  let operatorToken: string;
  let ref: { activityId: string; c1: string; c2: string; municipalityId: string; t1: string; t2: string };
  const events: Record<string, string> = {};
  // Termes-nonces uniques par exécution : la base E2E est partagée, on évite toute collision
  // avec des événements d'autres suites (ou des données résiduelles) portant les mêmes mots.
  const nonce = `zephyrus${Date.now()}`;
  const nonce2 = `deltacraft${Date.now()}`;

  beforeAll(async () => {
    app = await createTestApp();
    await ensureRoles(app);
    await ensureIdentitySeed(app);

    const db = prisma(app);
    const s = Date.now();
    const domain = await db.domain.create({ data: { name: `Dom S ${s}` } });
    const activity = await db.activity.create({ data: { name: `Act S ${s}`, domainId: domain.id } });
    const c1 = await db.category.create({ data: { name: `Compétition S ${s}` } });
    const c2 = await db.category.create({ data: { name: `Atelier S ${s}` } });
    const country = await db.country.create({ data: { name: `Pays S ${s}` } });
    const region = await db.region.create({ data: { name: `Reg S ${s}`, countryId: country.id } });
    const municipality = await db.municipality.create({ data: { name: `Ville S ${s}`, regionId: region.id } });
    const t1 = await db.tag.create({ data: { name: `TagUn ${s}` } });
    const t2 = await db.tag.create({ data: { name: `TagDeux ${s}` } });
    ref = { activityId: activity.id, c1: c1.id, c2: c2.id, municipalityId: municipality.id, t1: t1.id, t2: t2.id };

    await createUser(app, (organizerEmail = uniqueEmail('search-org')), PASSWORD, ['Organizer']);
    await createUser(app, (explorerEmail = uniqueEmail('search-ex')), PASSWORD, ['Explorer']);
    await createUser(app, (operatorEmail = uniqueEmail('search-op')), PASSWORD, ['Platform Operator']);
    organizerToken = await login(app, organizerEmail);
    explorerToken = await login(app, explorerEmail);
    operatorToken = await login(app, operatorEmail);

    events.champ = await publish(`Championnat ${nonce} régional`, 'grand tournoi compétitif', ref.c1, [ref.t1], '2027-05-10T10:00:00.000Z');
    events.atelier = await publish(`Atelier ${nonce2}`, 'initiation ludique au jeu', ref.c2, [ref.t2], '2027-05-20T10:00:00.000Z');
    events.hebdo = await publish('Tournoi hebdomadaire', `un ${nonce} amical`, ref.c1, [ref.t1], '2027-05-15T10:00:00.000Z');
  });

  afterAll(async () => {
    await app.close();
  });

  let organizerEmail = '';
  let explorerEmail = '';
  let operatorEmail = '';

  it('classe le titre au-dessus de la description pour un même terme', async () => {
    const res = await search(explorerToken, { q: nonce });
    const ids = res.items.map((e: { id: string }) => e.id);
    expect(ids).toContain(events.champ);
    expect(ids).toContain(events.hebdo);
    // Titre (poids A) prime sur description (poids C).
    expect(ids[0]).toBe(events.champ);
  });

  it('ne retourne que les événements correspondant au texte', async () => {
    const res = await search(explorerToken, { q: nonce2 });
    expect(res.items.map((e: { id: string }) => e.id)).toEqual([events.atelier]);
    expect(res.total).toBe(1);
  });

  it('cumule filtres indexés (catégorie) sans texte', async () => {
    const res = await search(explorerToken, { categoryId: ref.c1, sort: 'title' });
    // c1 est propre à cette exécution : seuls champ et hebdo la portent (ordre alphabétique).
    expect(res.items.map((e: { id: string }) => e.id)).toEqual([events.champ, events.hebdo]);
  });

  it('expose des facettes contextuelles au texte recherché', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/search/facets?q=${nonce}`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    const cat = (res.body.categories as { id: string; count: number }[]).find((c) => c.id === ref.c1);
    const act = (res.body.activities as { id: string; count: number }[]).find((a) => a.id === ref.activityId);
    const tag = (res.body.tags as { id: string; count: number }[]).find((t) => t.id === ref.t1);
    expect(cat?.count).toBe(2);
    expect(act?.count).toBe(2);
    expect(tag?.count).toBe(2);
  });

  it("retire un événement de l'index quand il quitte la diffusion", async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/events/${events.atelier}/unpublish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    const res = await search(explorerToken, { q: nonce2 });
    expect(res.items).toHaveLength(0);
  });

  it('reconstruit intégralement l\'index (supervision technique)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/search/reindex')
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);
    // Au moins les deux événements restés publiés de cette suite (atelier dépublié exclu).
    expect(res.body.indexed).toBeGreaterThanOrEqual(2);
    const after = await search(explorerToken, { q: nonce });
    expect(after.items.map((e: { id: string }) => e.id)).toContain(events.champ);
  });

  it('refuse la reconstruction sans la permission de supervision', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/search/reindex')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(403);
  });

  async function publish(
    title: string,
    description: string,
    categoryId: string,
    tagIds: string[],
    startsAt: string,
  ): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: ref.activityId, categoryId, municipalityId: ref.municipalityId, tagIds, title, description, startsAt })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/events/${created.body.id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    return created.body.id as string;
  }

  async function search(
    token: string,
    params: Record<string, string>,
  ): Promise<{ items: { id: string; title: string }[]; total: number }> {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search/events')
      .query(params)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return res.body;
  }
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
