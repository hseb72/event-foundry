import 'reflect-metadata';
import { QUEUES } from '@event-foundry/contracts';

/**
 * Point d'entrée du Classifier Worker (moteur expert).
 *
 * Consomme QUEUES.CLASSIFICATION, applique une chaîne de `ClassificationRule`
 * indépendantes (ADR.06) et produit un `ClassificationResult`.
 *
 * Règles déterministes uniquement : référentiels, alias, regex, heuristiques.
 * Aucune IA générative. Aucune persistance Event. Le Domain est toujours déduit de
 * l'Activity, jamais recherché directement.
 */
async function bootstrap(): Promise<void> {
  // TODO(EPIC 7) : instancier le Worker BullMQ sur QUEUES.CLASSIFICATION et le Rule Pipeline Engine.
  // eslint-disable-next-line no-console
  console.log(`Classifier Worker : à implémenter (consommation de ${QUEUES.CLASSIFICATION}).`);
}

void bootstrap();
