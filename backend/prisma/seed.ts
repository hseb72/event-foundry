/**
 * Seed EventFoundry (TSPEC.02).
 *
 * Initialise UNIQUEMENT :
 *   - référentiels de base (Domain, Activity, EventType, EventFormat) ;
 *   - rôles système ;
 *   - administrateur de développement.
 *
 * Aucune donnée fonctionnelle (Events, ImportJobs...) n'est créée ici.
 * Implémentation à compléter à l'EPIC 3/4.
 */
async function main(): Promise<void> {
  // TODO(EPIC 4) : instancier PrismaClient et créer les référentiels de base.
  // eslint-disable-next-line no-console
  console.log('Seed EventFoundry : à implémenter (référentiels + rôles + admin de dev).');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
