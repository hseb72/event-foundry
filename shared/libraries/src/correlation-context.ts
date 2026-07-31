import { AsyncLocalStorage } from 'node:async_hooks';
import { generateCorrelationId } from './correlation-id';

/**
 * Contexte de corrélation propagé implicitement au fil d'un traitement (requête HTTP ou Job),
 * sans avoir à passer le correlationId de fonction en fonction. Basé sur AsyncLocalStorage
 * (natif Node), donc utilisable aussi bien par le Backend que par les Workers (TSPEC.07).
 */
const storage = new AsyncLocalStorage<{ correlationId: string }>();

/** Exécute `fn` dans un contexte portant le correlationId donné (ou généré). */
export function runWithCorrelationId<T>(correlationId: string | undefined, fn: () => T): T {
  return storage.run({ correlationId: correlationId || generateCorrelationId() }, fn);
}

/** correlationId du contexte courant, ou undefined hors contexte. */
export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
