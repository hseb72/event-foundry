/**
 * Ingestion CLI de fiches **Lieu (Venue)** depuis un fichier JSON (DATA.01 v2.0 §10.4).
 *
 * Éprouve le modèle v2.0 : un lieu porte l'axe Sujet **partagé** (Activity « Jeux » + Subjects TCG)
 * et des Tags libres. Idempotent (ré-exécutable), fiches marquées `provisional = true` (curation).
 * Les `services[]` du JSON (Tournois, Ligues…) sont **hors taxonomie** (référentiel VenueService à
 * venir) : ignorés ici, sans perte de la donnée source (le JSON reste versionné).
 *
 * Usage :
 *   npm run venues:import                       # fichier par défaut scripts/data/venues-montpellier.json
 *   npm run venues:import -- --file ./autres.json
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, VenueType } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface StoreJson {
  slug: string;
  type: string;
  status: string;
  name: string;
  description?: string | null;
  address: { street?: string | null; postalCode?: string | null; city?: string | null; country?: string | null };
  phone?: string | null;
  website?: string | null;
  games: string[];
  services: string[];
  tags: string[];
}

// Normalisation des libellés de jeux du JSON vers les Subjects canoniques (Family TCG).
const GAME_TO_SUBJECT: Record<string, string> = {
  'Magic: The Gathering': 'Magic',
  'Disney Lorcana': 'Lorcana',
  'One Piece Card Game': 'One Piece',
  'Dragon Ball Super Card Game': 'Dragon Ball Super',
};

function subjectNameFor(game: string): string {
  return GAME_TO_SUBJECT[game] ?? game;
}

function venueTypeFor(type: string): VenueType {
  return type in VenueType ? (type as VenueType) : VenueType.OTHER;
}

async function main(): Promise<void> {
  const fileArgIndex = process.argv.indexOf('--file');
  const file =
    fileArgIndex >= 0 ? process.argv[fileArgIndex + 1] : join(__dirname, 'data', 'venues-montpellier.json');
  const stores = JSON.parse(readFileSync(file, 'utf8')) as StoreJson[];

  // Axe A : Activity « Jeux » (Domain « Général ») + Family « TCG » — pré-requis (seed v2).
  const general = await prisma.domain.findUnique({ where: { name: 'Général' } });
  if (!general) throw new Error('Domain « Général » absent : lancer le seed avant l’ingestion.');
  const jeux = await prisma.activity.findUnique({
    where: { domainId_name: { domainId: general.id, name: 'Jeux' } },
  });
  if (!jeux) throw new Error('Activité « Jeux » absente : lancer le seed avant l’ingestion.');
  const tcg = await prisma.activityFamily.upsert({
    where: { activityId_name: { activityId: jeux.id, name: 'TCG' } },
    update: {},
    create: { name: 'TCG', activityId: jeux.id },
  });

  let created = 0;
  let updated = 0;

  for (const store of stores) {
    // Résolution des sujets (jeux) : création provisoire si hors référentiel (ADR.24).
    const subjectIds: string[] = [];
    for (const game of store.games) {
      const name = subjectNameFor(game);
      const subject = await prisma.subject.upsert({
        where: { familyId_name: { familyId: tcg.id, name } },
        update: {},
        create: { name, familyId: tcg.id, provisional: true },
      });
      subjectIds.push(subject.id);
    }

    // Tags libres (Axe D) : upsert par nom.
    const tagIds: string[] = [];
    for (const tag of store.tags) {
      const row = await prisma.tag.upsert({ where: { name: tag }, update: {}, create: { name: tag } });
      tagIds.push(row.id);
    }

    const data = {
      description: store.description ?? null,
      venueType: venueTypeFor(store.type),
      address: store.address.street ?? null,
      postalCode: store.address.postalCode ?? null,
      city: store.address.city ?? null,
      country: store.address.country ?? null,
      phone: store.phone ?? null,
      website: store.website ?? null,
      isActive: store.status === 'ACTIVE',
      provisional: true,
    };

    // Idempotence : identité par (name, city). Remplacement intégral des liaisons.
    const existing = await prisma.venue.findFirst({
      where: { name: store.name, city: store.address.city ?? null },
      select: { id: true },
    });

    if (existing) {
      await prisma.venue.update({
        where: { id: existing.id },
        data: {
          ...data,
          activities: { deleteMany: {}, create: [{ activityId: jeux.id }] },
          subjects: { deleteMany: {}, create: subjectIds.map((subjectId) => ({ subjectId })) },
          tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
        },
      });
      updated += 1;
    } else {
      await prisma.venue.create({
        data: {
          name: store.name,
          ...data,
          activities: { create: [{ activityId: jeux.id }] },
          subjects: { create: subjectIds.map((subjectId) => ({ subjectId })) },
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      });
      created += 1;
    }
  }

  console.log(`Ingestion terminée : ${created} lieu(x) créé(s), ${updated} mis à jour (source : ${file}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
