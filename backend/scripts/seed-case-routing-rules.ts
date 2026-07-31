/**
 * Seed du **jeu de départ des règles de routage des Cases** (FSPEC.21 §14).
 *
 * Séparé du seed principal, qui n'initialise que référentiels, rôles et administrateur de
 * développement (TSPEC.02) : les règles de routage sont une **configuration d'exploitation**, propre
 * à chaque installation, et modifiable à chaud depuis la console Operator.
 *
 * Caractéristiques :
 * - **Idempotent** : identifiants déterministes (préfixe `DEMO_ID_PREFIX`, famille 4) ; ré-exécuté,
 *   le seed remet les règles dans leur état de référence sans créer de doublon ;
 * - **Non destructif** : les règles créées à la main (autres identifiants) ne sont jamais touchées ;
 * - **Réversible** : `--reset` retire uniquement les règles de ce jeu de départ.
 *
 * Le routage reste garanti sans aucune règle : le catalogue déterministe sert de repli (CASE-012).
 *
 * Usage :
 *   npm run cases:rules            # crée / remet à jour le jeu de départ
 *   npm run cases:rules -- --reset # retire le jeu de départ (les règles maison sont conservées)
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CASE_ROUTING_RULES } from './data/case-routing-rules';
import { demoId } from './reset-events';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Identifiants du jeu de départ (famille 4 du préfixe de démonstration). */
const ruleIds = CASE_ROUTING_RULES.map((rule) => demoId('4', rule.key));

async function seed(): Promise<number> {
  for (const rule of CASE_ROUTING_RULES) {
    const id = demoId('4', rule.key);
    const data = {
      name: rule.name,
      orderIndex: rule.orderIndex,
      isActive: true,
      criteria: rule.criteria as object,
      result: rule.result as object,
    };
    await prisma.caseRoutingRule.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  return CASE_ROUTING_RULES.length;
}

async function reset(): Promise<number> {
  const { count } = await prisma.caseRoutingRule.deleteMany({ where: { id: { in: ruleIds } } });
  return count;
}

async function main(): Promise<void> {
  if (process.argv.includes('--reset')) {
    const removed = await reset();
    console.log(`✅ Jeu de départ retiré : ${removed} règle(s) supprimée(s).`);
    console.log('   Les règles créées à la main sont conservées ; le routage par défaut reste garanti.');
    return;
  }

  const count = await seed();
  const total = await prisma.caseRoutingRule.count();
  console.log(`✅ ${count} règle(s) de routage en place (jeu de départ).`);
  console.log(`   ${total} règle(s) au total, évaluées par ordre croissant — la première applicable l'emporte.`);
  for (const rule of [...CASE_ROUTING_RULES].sort((a, b) => a.orderIndex - b.orderIndex)) {
    const priority = rule.result.priority ? ` · ${rule.result.priority}` : '';
    console.log(`   ${String(rule.orderIndex).padStart(3)} — ${rule.name} → ${rule.result.domain}${priority}`);
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed des règles de routage en échec :', error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
