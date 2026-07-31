import { randomUUID } from 'node:crypto';

/**
 * Génère un identifiant de corrélation unique.
 *
 * Un correlationId accompagne chaque requête et est propagé API → BullMQ → Workers → logs,
 * afin de reconstituer intégralement un traitement (TSPEC.07).
 */
export function generateCorrelationId(): string {
  return randomUUID();
}
