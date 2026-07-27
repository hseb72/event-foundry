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

  it('crée un brouillon enrichi puis déroule le workflow de publication', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        categoryIds: [refs.categoryId],
        municipalityId: refs.municipalityId,
        tagIds: [refs.tagId],
        title: 'Grand tournoi',
        startsAt: '2026-09-01T10:00:00.000Z',
      })
      .expect(201);

    expect(created.body.status).toBe('DRAFT'); // création = brouillon (workflow Publishing)
    expect(created.body.categories).toEqual([expect.any(String)]);
    expect(created.body.municipality).toBeTruthy();
    expect(created.body.tags).toHaveLength(1);
    const id = created.body.id as string;

    const at = (path: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/events/${id}/${path}`)
        .set('Authorization', `Bearer ${organizerToken}`);

    expect((await at('submit').expect(200)).body.status).toBe('SUBMITTED');
    expect((await at('publish').expect(200)).body.status).toBe('PUBLISHED');
    expect((await at('unpublish').expect(200)).body.status).toBe('DRAFT');
    expect((await at('archive').expect(200)).body.status).toBe('ARCHIVED');
    expect((await at('restore').expect(200)).body.status).toBe('DRAFT');

    // Transition interdite : DRAFT → PUBLISHED est permis, mais SUBMITTED → SUBMITTED non
    await at('unpublish').expect(422); // DRAFT → DRAFT interdit

    // Historique tracé (au moins la création + les transitions)
    const history = await request(app.getHttpServer())
      .get(`/api/v1/events/${id}/history`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(history.body.length).toBeGreaterThanOrEqual(6);
    expect(history.body[0].fromStatus).toBeNull();
    expect(history.body[0].toStatus).toBe('DRAFT');
  });

  it('filtre la recherche par catégorie, tag et commune, et masque les archivés', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        categoryIds: [refs.categoryId],
        municipalityId: refs.municipalityId,
        tagIds: [refs.tagId],
        title: 'Événement filtrable',
        startsAt: '2026-10-01T10:00:00.000Z',
      })
      .expect(201);
    const id = created.body.id as string;
    // Publier pour qu'il apparaisse dans la recherche par défaut (PUBLISHED)
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    const contains = async (queryString: string): Promise<boolean> => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/events?${queryString}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);
      return (res.body.items as { id: string }[]).some((e) => e.id === id);
    };

    expect(await contains(`categoryId=${refs.categoryId}`)).toBe(true);
    expect(await contains(`tagId=${refs.tagId}`)).toBe(true);
    expect(await contains(`municipalityId=${refs.municipalityId}`)).toBe(true);
    expect(await contains(`categoryId=${refs.municipalityId}`)).toBe(false); // catégorie ≠ id de commune

    // Une fois archivé, il disparaît de la recherche par défaut (PUBLISHED)
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/archive`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(await contains(`categoryId=${refs.categoryId}`)).toBe(false);
    expect(await contains(`categoryId=${refs.categoryId}&status=ARCHIVED`)).toBe(true);
  });

  it('gère les médias : upload, exposition sur la fiche, suppression, RBAC', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Événement média', startsAt: '2026-11-01T10:00:00.000Z' })
      .expect(201);
    const id = created.body.id as string;
    const png = Buffer.from('89504e470d0a1a0a', 'hex'); // en-tête PNG minimal

    // Explorer (sans event.update) → 403
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/media`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .attach('file', png, { filename: 'a.png', contentType: 'image/png' })
      .expect(403);

    // Type non-image → 422
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/media`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .attach('file', Buffer.from('texte'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(422);

    // Upload valide
    const uploaded = await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/media`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .attach('file', png, { filename: 'affiche.png', contentType: 'image/png' })
      .expect(201);
    expect(uploaded.body.url).toContain('https://minio.test/');
    const mediaId = uploaded.body.id as string;

    // Exposé sur la fiche
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/events/${id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(detail.body.media).toHaveLength(1);
    expect(detail.body.media[0].id).toBe(mediaId);

    // Suppression
    await request(app.getHttpServer())
      .delete(`/api/v1/events/${id}/media/${mediaId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(204);

    const after = await request(app.getHttpServer())
      .get(`/api/v1/events/${id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(after.body.media).toHaveLength(0);
  });

  it('liste mes événements tous statuts via createdByMe (espace Organizer)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Mon brouillon', startsAt: '2026-12-01T10:00:00.000Z' })
      .expect(201);
    const id = created.body.id as string;

    // createdByMe inclut les brouillons (pas de filtre PUBLISHED implicite)
    const mine = await request(app.getHttpServer())
      .get('/api/v1/events?createdByMe=true')
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(mine.body.items.map((e: { id: string }) => e.id)).toContain(id);

    // L'Explorer (autre utilisateur) ne voit pas ce brouillon dans ses propres événements
    const other = await request(app.getHttpServer())
      .get('/api/v1/events?createdByMe=true')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    expect(other.body.items.map((e: { id: string }) => e.id)).not.toContain(id);
  });

  it('inclut les événements passés dans createdByMe (espace Organizer), mais pas dans la découverte', async () => {
    // Événement daté dans le passé (édition terminée) : l'organisateur doit continuer à le gérer.
    const past = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Édition passée', startsAt: '2020-01-01T10:00:00.000Z' })
      .expect(201);
    const id = past.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    // Espace Organizer : l'événement passé est bien listé (aucune borne temporelle par défaut).
    const mine = await request(app.getHttpServer())
      .get('/api/v1/events?createdByMe=true&take=100')
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(mine.body.items.map((e: { id: string }) => e.id)).toContain(id);

    // Découverte publique : par défaut, seuls les événements à venir → le passé est masqué.
    const discover = await request(app.getHttpServer())
      .get('/api/v1/events?take=100')
      .set('Authorization', `Bearer ${explorerToken}`)
      .expect(200);
    expect(discover.body.items.map((e: { id: string }) => e.id)).not.toContain(id);
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

  it('corrige un brouillon invalide puis le publie (dates rattrapées, sans recréation)', async () => {
    // Brouillon avec des dates incohérentes (fin avant début) : la publication échoue.
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        title: 'Tournoi à corriger',
        startsAt: '2027-02-10T10:00:00.000Z',
        endsAt: '2027-02-09T10:00:00.000Z',
      })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(422);

    // Correction du même événement (PATCH) : on rétablit une fin cohérente + on enrichit.
    const corrected = await request(app.getHttpServer())
      .patch(`/api/v1/events/${id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        activityId: refs.activityId,
        categoryIds: [refs.categoryId],
        tagIds: [refs.tagId],
        title: 'Tournoi corrigé',
        startsAt: '2027-02-10T10:00:00.000Z',
        endsAt: '2027-02-10T18:00:00.000Z',
      })
      .expect(200);
    expect(corrected.body.title).toBe('Tournoi corrigé');
    expect(corrected.body.status).toBe('DRAFT');
    expect(corrected.body.categories).toEqual([expect.any(String)]);
    expect(corrected.body.tags).toContain((await tagName(refs.tagId)));

    // La vue d'édition expose les référentiels par identifiant (préremplissage du formulaire).
    const editView = await request(app.getHttpServer())
      .get(`/api/v1/events/${id}/edit`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(editView.body.editable).toBe(true);
    expect(editView.body.categoryIds).toEqual([refs.categoryId]);
    expect(editView.body.tagIds).toContain(refs.tagId);

    // La publication passe désormais.
    const published = await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    expect(published.body.status).toBe('PUBLISHED');
  });

  it('refuse la modification d\'un événement publié (409) tant qu\'il n\'est pas dépublié', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Publié figé', startsAt: '2027-03-01T10:00:00.000Z' })
      .expect(201);
    const id = created.body.id as string;
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/publish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/v1/events/${id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Tentative interdite', startsAt: '2027-03-01T10:00:00.000Z' })
      .expect(409);

    // Après dépublication, la correction est de nouveau possible.
    await request(app.getHttpServer())
      .post(`/api/v1/events/${id}/unpublish`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);
    const corrected = await request(app.getHttpServer())
      .patch(`/api/v1/events/${id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Corrigé après dépublication', startsAt: '2027-03-01T10:00:00.000Z' })
      .expect(200);
    expect(corrected.body.title).toBe('Corrigé après dépublication');
  });

  it('réserve la modification à la permission event.update (403 pour Explorer)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ activityId: refs.activityId, title: 'Brouillon protégé', startsAt: '2027-04-01T10:00:00.000Z' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/events/${created.body.id}`)
      .set('Authorization', `Bearer ${explorerToken}`)
      .send({ activityId: refs.activityId, title: 'Hack', startsAt: '2027-04-01T10:00:00.000Z' })
      .expect(403);
  });

  async function tagName(tagId: string): Promise<string> {
    const tag = await prisma(app).tag.findUniqueOrThrow({ where: { id: tagId } });
    return tag.name;
  }
});

async function login(app: INestApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return res.body.accessToken as string;
}
