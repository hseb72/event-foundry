import type { ConfidenceByField, ExtractedEventFields, RawEvent } from '@event-foundry/contracts';

/** Résultat de validation d'un Raw Event (RG-IMP : rejet sans correction). */
export interface ValidationOutcome {
  valid: RawEvent[];
  rejected: { rawEvent: RawEvent; reason: string }[];
}

/**
 * Projection normalisée d'un Raw Event vers le modèle commun (noms de référentiels, pas d'IDs) —
 * même forme que `ExtractedEventFields` du classifier, réutilisée par la validation humaine.
 * `signature` = clé métier de rapprochement (titre + date + lieu), calculée à la normalisation.
 */
export interface NormalizedEvent {
  rawEventId: string;
  providerId: string;
  providerKey: string | null;
  fields: ExtractedEventFields;
  confidence: ConfidenceByField;
  signature: string;
}

/** Décision de déduplication d'une projection normalisée. */
export interface DedupeOutcome {
  kept: NormalizedEvent[];
  duplicates: NormalizedEvent[];
}
