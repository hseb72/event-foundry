/**
 * Seed EventFoundry (TSPEC.02).
 *
 * Initialise UNIQUEMENT :
 *   - les rôles système (ADMIN, USER) ;
 *   - un administrateur de développement (jamais utilisé en production) ;
 *   - les référentiels de base (Domain TCG + Activities V1, quelques EventType et alias).
 *
 * Idempotent (upsert). Aucune donnée fonctionnelle (Events, ImportJobs...) n'est créée ici.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SYSTEM_ROLES = ['ADMIN', 'USER'] as const;
const SALT_ROUNDS = 12;

// Activities TCG ciblées par la V1 (VISION).
const TCG_ACTIVITIES = [
  'Magic',
  'Pokémon',
  'Lorcana',
  'One Piece',
  'Star Wars Unlimited',
  'Flesh and Blood',
  'Riftbound',
];

async function seedRolesAndAdmin(): Promise<void> {
  for (const name of SYSTEM_ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  const email = process.env.DEV_ADMIN_EMAIL ?? 'admin@event-foundry.local';
  const password = process.env.DEV_ADMIN_PASSWORD ?? 'change-me-dev-only';
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      displayName: 'Dev Admin',
      roles: { create: [{ role: { connect: { id: adminRole.id } } }] },
    },
  });
}

async function seedReferenceData(): Promise<void> {
  const tcg = await prisma.domain.upsert({
    where: { name: 'TCG' },
    update: {},
    create: { name: 'TCG' },
  });

  for (const name of TCG_ACTIVITIES) {
    await prisma.activity.upsert({
      where: { domainId_name: { domainId: tcg.id, name } },
      update: {},
      create: { name, domainId: tcg.id },
    });
  }

  const magic = await prisma.activity.findUnique({
    where: { domainId_name: { domainId: tcg.id, name: 'Magic' } },
  });
  if (magic) {
    for (const name of ['Avant-première', 'Tournoi']) {
      await prisma.eventType.upsert({
        where: { activityId_name: { activityId: magic.id, name } },
        update: {},
        create: { name, activityId: magic.id },
      });
    }
    for (const value of ['MTG', 'Magic The Gathering']) {
      await prisma.alias.upsert({
        where: { value },
        update: {},
        create: { value, activityId: magic.id },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedRolesAndAdmin();
  await seedReferenceData();
  console.log('Seed terminé : rôles + admin de dev + référentiels TCG de base.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
