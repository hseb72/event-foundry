/**
 * Seed d'**événements fictifs** pour la phase de test (données de démonstration).
 *
 * Volontairement **séparé** de `prisma/seed.ts` : ce dernier n'initialise que les référentiels, les
 * rôles et l'administrateur de développement — jamais de donnée fonctionnelle (TSPEC.02 §seed). Ce
 * script complète une base déjà semée avec une vingtaine d'événements couvrant plusieurs univers,
 * statuts et visibilités, afin d'éprouver la Découverte, la recherche, le planning, la vue Organizer
 * et la page de garde publique.
 *
 * Caractéristiques :
 * - **Idempotent** : identifiants déterministes (préfixe `DEMO_ID_PREFIX`), ré-exécutable sans doublon ;
 * - **Tolérant** : toute valeur de taxonomie introuvable est ignorée avec un avertissement, plutôt que
 *   de faire échouer le seed (base partiellement peuplée) ;
 * - **Index de recherche reconstruit** en fin de course via le `SearchIndexService` réel (aucune
 *   duplication de la logique d'indexation) — sans quoi les événements n'apparaîtraient pas en
 *   Découverte / recherche, qui lisent la projection `search_documents`.
 *
 * Usage :
 *   npm run demo:events              # crée / met à jour les événements de démonstration
 *   npm run demo:events -- --reset   # remet d'abord à zéro les événements (cf. reset-events.ts)
 */
import { EventSource, EventStatus, EventVisibility, PrismaClient, VenueType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { SearchRepository } from '../src/search/repositories/search.repository';
import { SearchIndexService } from '../src/search/services/search-index.service';
import { DEMO_EVENTS, DEMO_ORGANIZERS, DEMO_VENUES, type DemoEvent } from './data/demo-events';
import { DEMO_ID_PREFIX, demoId, resetEvents } from './reset-events';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Libellés de taxonomie introuvables, signalés une seule fois en fin d'exécution. */
const missing = new Set<string>();

function warnMissing(kind: string, name: string): void {
  missing.add(`${kind} « ${name} »`);
}

/** Date de début d'un événement de démonstration (aujourd'hui + décalage, à l'heure indiquée, UTC). */
function startOf(demo: DemoEvent): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + demo.dayOffset);
  date.setUTCHours(demo.hour, 0, 0, 0);
  return date;
}

/** Organisateurs fictifs (identifiants déterministes → idempotence et suppression ciblée). */
async function seedOrganizers(): Promise<Map<string, string>> {
  const byName = new Map<string, string>();
  for (const organizer of DEMO_ORGANIZERS) {
    const id = demoId('1', organizer.key);
    await prisma.organizer.upsert({
      where: { id },
      update: { name: organizer.name, website: organizer.website },
      create: { id, name: organizer.name, website: organizer.website },
    });
    byName.set(organizer.name, id);
  }
  return byName;
}

/** Lieu fictif résolu : son identifiant et sa ville (utilisée pour rattacher l'Event à une commune). */
interface DemoVenueRef {
  id: string;
  city: string;
}

/** Lieux fictifs. La commune n'est pas portée par le lieu mais par l'Event (schéma) : cf. `seedEvent`. */
async function seedVenues(): Promise<Map<string, DemoVenueRef>> {
  const byName = new Map<string, DemoVenueRef>();
  for (const venue of DEMO_VENUES) {
    const id = demoId('2', venue.key);
    const data = {
      name: venue.name,
      venueType: VenueType.OTHER,
      address: venue.address,
      postalCode: venue.postalCode,
      city: venue.city,
      country: 'France',
      latitude: venue.latitude,
      longitude: venue.longitude,
    };
    await prisma.venue.upsert({ where: { id }, update: data, create: { id, ...data } });
    byName.set(venue.name, { id, city: venue.city });
  }
  return byName;
}

/** Commune du référentiel correspondant à une ville, si elle a été importée (GeoNames) — sinon null. */
async function municipalityIdFor(city: string | null): Promise<string | null> {
  if (!city) {
    return null;
  }
  const municipality = await prisma.municipality.findFirst({
    where: { name: city, isActive: true },
    select: { id: true },
  });
  return municipality?.id ?? null;
}

/** Résout un référentiel par nom, en mémorisant les absences (taxonomie partiellement semée). */
async function resolve(demo: DemoEvent): Promise<{
  activityId: string;
  eventTypeId: string | null;
  subjectIds: string[];
  modalityIds: string[];
  tagIds: string[];
} | null> {
  const activity = await prisma.activity.findFirst({ where: { name: demo.activity }, select: { id: true } });
  if (!activity) {
    // L'Activité est obligatoire (DATA.01) : sans elle, l'événement ne peut pas exister.
    warnMissing('Activité', demo.activity);
    return null;
  }
  const eventType = await prisma.eventType.findFirst({ where: { name: demo.eventType }, select: { id: true } });
  if (!eventType) {
    warnMissing("Type d'événement", demo.eventType);
  }

  const subjectIds: string[] = [];
  for (const name of demo.subjects) {
    const subject = await prisma.subject.findFirst({ where: { name }, select: { id: true } });
    subject ? subjectIds.push(subject.id) : warnMissing('Sujet', name);
  }
  const modalityIds: string[] = [];
  for (const name of demo.modalities) {
    const modality = await prisma.modality.findFirst({ where: { name }, select: { id: true } });
    modality ? modalityIds.push(modality.id) : warnMissing('Modalité', name);
  }
  const tagIds: string[] = [];
  for (const name of demo.tags ?? []) {
    const tag = await prisma.tag.findFirst({ where: { name }, select: { id: true } });
    tag ? tagIds.push(tag.id) : warnMissing('Tag', name);
  }
  return { activityId: activity.id, eventTypeId: eventType?.id ?? null, subjectIds, modalityIds, tagIds };
}

/**
 * Crée (ou met à jour) un événement de démonstration et ses rattachements N-N. Les liens sont
 * remplacés à chaque exécution pour rester alignés sur le fichier de données.
 */
async function seedEvent(
  demo: DemoEvent,
  organizers: Map<string, string>,
  venues: Map<string, DemoVenueRef>,
  ownerId: string | null,
): Promise<boolean> {
  const refs = await resolve(demo);
  if (!refs) {
    return false;
  }
  const id = demoId('0', demo.key);
  const startsAt = startOf(demo);
  const endsAt = new Date(startsAt.getTime() + demo.durationH * 3600_000);
  const status = (demo.status ?? 'PUBLISHED') as EventStatus;
  const venue = demo.venue ? (venues.get(demo.venue) ?? null) : null;
  const municipalityId = await municipalityIdFor(venue?.city ?? null);

  const data = {
    source: EventSource.MANUAL,
    status,
    // Un événement privé est personnel (FSPEC.22) : rattaché à son créateur, jamais publié.
    visibility: demo.private ? EventVisibility.PRIVATE : EventVisibility.PUBLIC,
    activityId: refs.activityId,
    eventTypeId: refs.eventTypeId,
    organizerId: demo.organizer ? (organizers.get(demo.organizer) ?? null) : null,
    venueId: venue?.id ?? null,
    municipalityId,
    title: demo.title,
    description: demo.description,
    startsAt,
    endsAt,
    price: demo.price ?? null,
    currency: demo.price != null ? 'EUR' : null,
    createdById: ownerId,
    publishedAt: status === EventStatus.PUBLISHED ? new Date() : null,
    deletedAt: null,
  };

  await prisma.event.upsert({ where: { id }, update: data, create: { id, ...data } });

  // Rattachements N-N : remplacés intégralement (le fichier de données fait foi).
  await prisma.eventSubject.deleteMany({ where: { eventId: id } });
  await prisma.eventModality.deleteMany({ where: { eventId: id } });
  await prisma.eventTag.deleteMany({ where: { eventId: id } });
  for (const subjectId of refs.subjectIds) {
    await prisma.eventSubject.create({ data: { eventId: id, subjectId } });
  }
  for (const modalityId of refs.modalityIds) {
    await prisma.eventModality.create({ data: { eventId: id, modalityId } });
  }
  for (const tagId of refs.tagIds) {
    await prisma.eventTag.create({ data: { eventId: id, tagId } });
  }
  return true;
}

/** Reconstruit l'index de recherche avec le service réel (Découverte / recherche lisent la projection). */
async function rebuildSearchIndex(): Promise<number> {
  const service = new PrismaService();
  try {
    await service.$connect();
    const indexService = new SearchIndexService(new SearchRepository(service));
    return await indexService.rebuild();
  } finally {
    await service.$disconnect();
  }
}

async function main(): Promise<void> {
  const withReset = process.argv.includes('--reset');
  if (withReset) {
    const removed = await resetEvents(prisma, { scope: 'all' });
    console.log(`↺ Remise à zéro : ${removed} événement(s) supprimé(s).`);
  }

  // Propriétaire des événements de démonstration : l'admin de développement s'il existe.
  const owner = await prisma.user.findFirst({
    where: { email: process.env.DEV_ADMIN_EMAIL ?? 'admin@event-foundry.local' },
    select: { id: true },
  });
  if (!owner) {
    console.warn(
      '⚠️  Administrateur de développement introuvable : les événements privés ne seront visibles ' +
        "d'aucun utilisateur. Exécutez d'abord `npm run prisma:seed`.",
    );
  }

  const organizers = await seedOrganizers();
  const venues = await seedVenues();

  let created = 0;
  let skipped = 0;
  for (const demo of DEMO_EVENTS) {
    (await seedEvent(demo, organizers, venues, owner?.id ?? null)) ? created++ : skipped++;
  }

  const indexed = await rebuildSearchIndex();

  console.log(`✅ ${created} événement(s) de démonstration en base (préfixe ${DEMO_ID_PREFIX}).`);
  console.log(`   ${DEMO_ORGANIZERS.length} organisateur(s) et ${DEMO_VENUES.length} lieu(x) fictifs.`);
  console.log(`   Index de recherche reconstruit : ${indexed} document(s).`);
  if (skipped > 0) {
    console.warn(`⚠️  ${skipped} événement(s) ignoré(s) faute d'Activité correspondante.`);
  }
  if (missing.size > 0) {
    console.warn(`⚠️  Référentiels introuvables (ignorés) : ${[...missing].join(', ')}.`);
    console.warn('   Exécutez `npm run prisma:seed` pour semer la taxonomie complète.');
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed des événements de démonstration en échec :', error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
