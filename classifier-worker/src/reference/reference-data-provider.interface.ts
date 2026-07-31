import type { ReferenceSnapshot } from './reference-snapshot';

export const REFERENCE_DATA_PROVIDER = 'REFERENCE_DATA_PROVIDER';

/**
 * Fournit un instantané des référentiels au moteur expert. Le worker ne dépend jamais de
 * PostgreSQL ni de Prisma (TSPEC.05, ADR.07) : la source concrète (API Backend, cache
 * Redis...) est un détail d'implémentation derrière cette abstraction.
 */
export interface ReferenceDataProvider {
  getSnapshot(): Promise<ReferenceSnapshot>;
}
