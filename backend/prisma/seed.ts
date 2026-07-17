/**
 * Seed EventFoundry (TSPEC.02).
 *
 * Initialise UNIQUEMENT :
 *   - les rôles système (ADMIN, USER) ;
 *   - un administrateur de développement (jamais utilisé en production).
 *
 * Les référentiels métier (Domain, Activity, EventType, EventFormat) seront ajoutés à
 * l'EPIC 3. Aucune donnée fonctionnelle (Events, ImportJobs...) n'est créée ici.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SYSTEM_ROLES = ['ADMIN', 'USER'] as const;
const SALT_ROUNDS = 12;

async function main(): Promise<void> {
  // Rôles système (idempotent).
  for (const name of SYSTEM_ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Administrateur de développement.
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

  console.log(`Seed terminé : rôles ${SYSTEM_ROLES.join(', ')} + admin de dev (${email}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
