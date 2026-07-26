/**
 * Seed EventFoundry (TSPEC.02 + Identity V2 / EPIC 01).
 *
 * Initialise UNIQUEMENT des référentiels et des comptes de développement :
 *   - permissions atomiques (ADR.08) ;
 *   - rôles V2 (Explorer, Organizer, Platform Operator, Customer Success, Finance) et leurs
 *     grants de permissions, + rôles legacy V1 (ADMIN, USER) conservés pour compatibilité ;
 *   - offres d'abonnement (Free / Pro / Premium — ADR.11) ;
 *   - un administrateur de développement + une organisation de démonstration ;
 *   - les référentiels métier de base (Domain TCG + Activities V1, quelques EventType et alias).
 *
 * Idempotent (upsert + ressynchronisation des grants). Aucune donnée fonctionnelle
 * (Events, ImportJobs…) n'est créée ici.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Experience, PrismaClient, RoleScope } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Lit une variable d'environnement OBLIGATOIRE (aucun secret par défaut codé en dur — ADR.21).
 * Inliné ici pour que ce script de dev reste autonome (pas de dépendance au build de shared).
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value && value.trim().length > 0) {
    return value;
  }
  throw new Error(
    `Variable d'environnement requise absente : ${name}. ` +
      "Aucun secret par défaut n'est fourni (ADR.21) — renseignez-la dans votre .env.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SALT_ROUNDS = 12;

// Rôles legacy V1 conservés le temps de la transition vers le RBAC V2.
const LEGACY_ROLES = ['ADMIN', 'USER'] as const;

// --- Permissions atomiques (unité de contrôle du backend — ADR.08 / FSPEC.10) ---
const PERMISSIONS: Record<string, string> = {
  'catalog.read': 'Consulter le catalogue des événements',
  'event.read': 'Consulter un événement',
  'event.create': 'Créer un événement',
  'event.update': 'Modifier un événement',
  'event.publish': 'Publier / dépublier un événement',
  'event.archive': 'Archiver un événement',
  'import.create': 'Soumettre un document à importer',
  'import.execute': "Exécuter le pipeline d'import (OCR / classification)",
  'validation.review': "Valider / corriger les candidats issus de l'import",
  'planning.manage': 'Gérer son planning personnel',
  'reservation.manage': 'Gérer ses réservations',
  'recommendation.view': 'Recevoir des recommandations',
  'dashboard.view': 'Accéder à un tableau de bord',
  'statistics.view': 'Consulter des statistiques',
  'organization.manage': 'Gérer son organisation',
  'member.manage': "Gérer les collaborateurs d'une organisation",
  'organization.transfer': "Transférer la propriété d'une organisation",
  'case.manage': 'Traiter les dossiers (Cases) adressés aux Operators',
  'reference.manage': 'Administrer les référentiels',
  'pipeline.manage': 'Superviser le pipeline documentaire',
  'user.manage': 'Administrer les utilisateurs et leurs rôles',
  'account.support': 'Accompagner les comptes organisateurs',
  'billing.manage': 'Gérer la facturation et les paiements',
  'subscription.manage': 'Gérer les abonnements',
};

// --- Rôles V2 : responsabilité + expérience débloquée + grants (FSPEC.10) ---
interface RoleSeed {
  name: string;
  description: string;
  scope: RoleScope;
  experience: Experience;
  permissions: string[];
}

const ROLES: RoleSeed[] = [
  {
    name: 'Explorer',
    description: "Utilisateur grand public : catalogue, planning, réservations, recommandations.",
    scope: RoleScope.PLATFORM,
    experience: Experience.EXPLORER,
    permissions: [
      'catalog.read',
      'event.read',
      'planning.manage',
      'reservation.manage',
      'recommendation.view',
    ],
  },
  {
    name: 'Organizer',
    description: 'Publie et gère les événements de son organisation.',
    scope: RoleScope.ORGANIZATION,
    experience: Experience.ORGANIZER,
    permissions: [
      'catalog.read',
      'event.read',
      'event.create',
      'event.update',
      'event.publish',
      'event.archive',
      'import.create',
      'import.execute',
      'dashboard.view',
      'statistics.view',
      'organization.manage',
    ],
  },
  // Fonctions d'organisation (FSPEC.19) : Owner ⊃ Administrator ⊃ Event Manager.
  {
    name: 'Owner',
    description: "Propriétaire de l'organisation : tous les droits, dont le transfert de propriété.",
    scope: RoleScope.ORGANIZATION,
    experience: Experience.ORGANIZER,
    permissions: [
      'catalog.read',
      'event.read',
      'event.create',
      'event.update',
      'event.publish',
      'event.archive',
      'import.create',
      'import.execute',
      'dashboard.view',
      'statistics.view',
      'organization.manage',
      'member.manage',
      'organization.transfer',
    ],
  },
  {
    name: 'Administrator',
    description: "Assiste le Owner dans la gestion de l'organisation et des collaborateurs.",
    scope: RoleScope.ORGANIZATION,
    experience: Experience.ORGANIZER,
    permissions: [
      'catalog.read',
      'event.read',
      'event.create',
      'event.update',
      'event.publish',
      'event.archive',
      'import.create',
      'import.execute',
      'dashboard.view',
      'statistics.view',
      'organization.manage',
      'member.manage',
    ],
  },
  {
    name: 'Event Manager',
    description: "Crée, modifie, publie et archive les événements de l'organisation.",
    scope: RoleScope.ORGANIZATION,
    experience: Experience.ORGANIZER,
    permissions: [
      'catalog.read',
      'event.read',
      'event.create',
      'event.update',
      'event.publish',
      'event.archive',
      'import.create',
      'import.execute',
      'dashboard.view',
      'statistics.view',
    ],
  },
  {
    name: 'Organisateur autonome',
    description:
      'Organisateur individuel (mode autonome, sans organisation) : crée et publie ses propres événements.',
    scope: RoleScope.PLATFORM,
    experience: Experience.ORGANIZER,
    permissions: [
      'catalog.read',
      'event.read',
      'event.create',
      'event.update',
      'event.publish',
      'event.archive',
      'import.create',
      'import.execute',
      'dashboard.view',
      'statistics.view',
    ],
  },
  {
    name: 'Platform Operator',
    description: 'Supervise le pipeline documentaire, les référentiels et les traitements.',
    scope: RoleScope.PLATFORM,
    experience: Experience.OPERATOR,
    permissions: [
      'catalog.read',
      'event.read',
      'import.execute',
      'validation.review',
      'reference.manage',
      'pipeline.manage',
      'dashboard.view',
      'user.manage',
      'case.manage',
    ],
  },
  {
    name: 'Customer Success',
    description: "Accompagne les organisateurs, sans permissions techniques.",
    scope: RoleScope.PLATFORM,
    experience: Experience.OPERATOR,
    permissions: ['catalog.read', 'event.read', 'dashboard.view', 'statistics.view', 'account.support'],
  },
  {
    name: 'Finance',
    description: 'Gère les abonnements, la facturation et les paiements.',
    scope: RoleScope.PLATFORM,
    experience: Experience.OPERATOR,
    permissions: ['dashboard.view', 'billing.manage', 'subscription.manage'],
  },
];

// --- Offres d'abonnement (ADR.11) ---
const SUBSCRIPTION_PLANS = [
  { key: 'FREE', name: 'Free', level: 0 },
  { key: 'PRO', name: 'Pro', level: 1 },
  { key: 'PREMIUM', name: 'Premium', level: 2 },
];

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

async function seedPermissions(): Promise<void> {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
}

async function seedRoles(): Promise<void> {
  // Rôles legacy V1 (compatibilité guards existants).
  for (const name of LEGACY_ROLES) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Rôles V2 + resynchronisation stricte de leurs grants (le seed fait autorité).
  for (const roleSeed of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleSeed.name },
      update: {
        description: roleSeed.description,
        scope: roleSeed.scope,
        experience: roleSeed.experience,
      },
      create: {
        name: roleSeed.name,
        description: roleSeed.description,
        scope: roleSeed.scope,
        experience: roleSeed.experience,
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { key: { in: roleSeed.permissions } },
      select: { id: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
  }
}

async function seedSubscriptionPlans(): Promise<void> {
  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, level: plan.level },
      create: plan,
    });
  }
}

async function seedAdminAndDemoOrg(): Promise<void> {
  const email = process.env.DEV_ADMIN_EMAIL ?? 'admin@event-foundry.local';
  // Mot de passe requis : jamais de valeur par défaut codée en dur (ADR.21). Évite de créer un
  // admin au mot de passe connu si le seed est lancé sur un environnement non prévu.
  const password = requireEnv('DEV_ADMIN_PASSWORD');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Rôles plateforme de l'admin de dev : Operator (back-office) + Explorer (grand public) + ADMIN legacy.
  const [adminLegacy, operator, explorer, organizer] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } }),
    prisma.role.findUniqueOrThrow({ where: { name: 'Platform Operator' } }),
    prisma.role.findUniqueOrThrow({ where: { name: 'Explorer' } }),
    prisma.role.findUniqueOrThrow({ where: { name: 'Organizer' } }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, displayName: 'Dev Admin', activeExperience: Experience.OPERATOR },
  });

  for (const role of [adminLegacy, operator, explorer]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: role.id } },
      update: {},
      create: { userId: admin.id, roleId: role.id },
    });
  }

  // Organisation de démonstration : l'admin y est Organizer (rôle d'organisation).
  const freePlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { key: 'FREE' } });
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'eventfoundry-demo' },
    update: {},
    create: { name: 'EventFoundry Demo', slug: 'eventfoundry-demo', subscriptionPlanId: freePlan.id },
  });

  const membership = await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: admin.id, organizationId: demoOrg.id } },
    update: {},
    create: { userId: admin.id, organizationId: demoOrg.id },
  });
  await prisma.membershipRole.upsert({
    where: { membershipId_roleId: { membershipId: membership.id, roleId: organizer.id } },
    update: {},
    create: { membershipId: membership.id, roleId: organizer.id },
  });

  // Expérience et contexte org actifs par défaut de l'admin (idempotent, même si l'user existait).
  await prisma.user.update({
    where: { id: admin.id },
    data: { activeExperience: Experience.OPERATOR, activeOrganizationId: demoOrg.id },
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

// Amorce géographique minimale (France → régions → villes) — EPIC 02.
const GEOGRAPHY: { country: string; code: string; regions: { name: string; cities: [string, string][] }[] } = {
  country: 'France',
  code: 'FR',
  regions: [
    { name: 'Île-de-France', cities: [['Paris', '75000']] },
    { name: 'Auvergne-Rhône-Alpes', cities: [['Lyon', '69000'], ['Grenoble', '38000']] },
    { name: 'Occitanie', cities: [['Toulouse', '31000']] },
  ],
};

// Référentiels transverses de démonstration (EPIC 02/03).
const CATEGORIES = ['Compétition', 'Découverte', 'Famille', 'Communautaire'];
const TAGS = ['débutant', 'compétitif', 'famille', 'gratuit', 'nouveauté'];

async function seedCatalogReferentials(): Promise<void> {
  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of TAGS) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function seedGeography(): Promise<void> {
  const country = await prisma.country.upsert({
    where: { name: GEOGRAPHY.country },
    update: { code: GEOGRAPHY.code },
    create: { name: GEOGRAPHY.country, code: GEOGRAPHY.code },
  });

  for (const region of GEOGRAPHY.regions) {
    const created = await prisma.region.upsert({
      where: { countryId_name: { countryId: country.id, name: region.name } },
      update: {},
      create: { name: region.name, countryId: country.id },
    });
    for (const [city, postalCode] of region.cities) {
      await prisma.municipality.upsert({
        where: { regionId_name: { regionId: created.id, name: city } },
        update: { postalCode },
        create: { name: city, regionId: created.id, postalCode },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedPermissions();
  await seedRoles();
  await seedSubscriptionPlans();
  await seedAdminAndDemoOrg();
  await seedReferenceData();
  await seedCatalogReferentials();
  await seedGeography();
  console.log(
    'Seed terminé : permissions + rôles V2 + abonnements + admin + organisation démo + référentiels TCG + catégories/tags + géographie FR.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
