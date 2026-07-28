/**
 * Remise à zéro des **événements** pour la phase de test.
 *
 * Supprime les événements du catalogue et, avec eux, tout ce qui en dépend directement — la base
 * assure la cohérence : `event_subjects`, `event_modalities`, `event_tags`, `event_media`,
 * `event_status_events`, `search_documents`, `user_participation` et `recommendation_feedback` sont
 * supprimés en cascade ; les notifications et candidats d'import voient simplement leur référence
 * remise à nul (`SET NULL`). **Les référentiels, comptes et organisations ne sont jamais touchés.**
 *
 * Deux portées :
 * - `--demo` (défaut) : ne supprime que les données de **démonstration** (identifiants déterministes
 *   du seed de démonstration), y compris les organisateurs et lieux fictifs — la donnée saisie à la
 *   main est conservée ;
 * - `--all` : supprime **tous** les événements (les référentiels restent intacts).
 *
 * Usage :
 *   npm run events:reset             # supprime uniquement les événements de démonstration
 *   npm run events:reset -- --all    # supprime tous les événements du catalogue
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { DEMO_EVENTS, DEMO_ORGANIZERS, DEMO_VENUES } from './data/demo-events';

/**
 * Préfixe des identifiants de démonstration. Tous les objets créés par `seed-demo-events.ts`
 * (événements, organisateurs, lieux) en héritent, ce qui permet de les reconnaître et de les
 * supprimer sélectivement sans marqueur supplémentaire en base.
 */
export const DEMO_ID_PREFIX = 'de300000-0000-4000-8000-';

/**
 * Identifiant déterministe d'un objet de démonstration : `family` (1 chiffre : 0 événement,
 * 1 organisateur, 2 lieu) + `key` (2 chiffres), complété en UUID valide.
 */
export function demoId(family: string, key: string): string {
  return `${DEMO_ID_PREFIX}${family.padStart(3, '0')}${key.padStart(9, '0')}`;
}

export interface ResetOptions {
  /** `demo` : uniquement les données de démonstration ; `all` : tous les événements. */
  scope: 'demo' | 'all';
}

/**
 * Supprime les événements selon la portée demandée et renvoie le nombre d'événements supprimés.
 * En portée `demo`, les organisateurs et lieux fictifs sont également retirés (après les événements,
 * qui les référencent). Les identifiants sont énumérés explicitement : PostgreSQL n'accepte pas de
 * filtre textuel (`LIKE`) sur une colonne `uuid`.
 */
export async function resetEvents(prisma: PrismaClient, options: ResetOptions): Promise<number> {
  if (options.scope === 'all') {
    const { count } = await prisma.event.deleteMany({});
    // L'index de recherche est une projection reconstructible : on le vide également.
    await prisma.searchDocument.deleteMany({});
    return count;
  }

  const eventIds = DEMO_EVENTS.map((demo) => demoId('0', demo.key));
  const organizerIds = DEMO_ORGANIZERS.map((organizer) => demoId('1', organizer.key));
  const venueIds = DEMO_VENUES.map((venue) => demoId('2', venue.key));

  const { count } = await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
  await prisma.organizer.deleteMany({ where: { id: { in: organizerIds } } });
  return count;
}

/** Exécution en ligne de commande (le module est aussi importé par `seed-demo-events.ts`). */
async function main(): Promise<void> {
  const scope: ResetOptions['scope'] = process.argv.includes('--all') ? 'all' : 'demo';
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const removed = await resetEvents(prisma, { scope });
    const label = scope === 'all' ? 'tous les événements' : 'les événements de démonstration';
    console.log(`✅ Remise à zéro (${label}) : ${removed} événement(s) supprimé(s).`);
    if (scope === 'demo') {
      console.log('   Organisateurs et lieux fictifs supprimés. Référentiels et comptes intacts.');
    } else {
      console.log('   Index de recherche vidé. Référentiels, comptes et organisations intacts.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuté directement (et non importé) : lance la remise à zéro.
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Remise à zéro en échec :', error);
    process.exitCode = 1;
  });
}
