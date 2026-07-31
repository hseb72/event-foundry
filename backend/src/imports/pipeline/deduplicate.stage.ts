import { Injectable } from '@nestjs/common';
import type { DedupeOutcome, NormalizedEvent } from './pipeline.types';

/**
 * Étape **Deduplicate** du pipeline (ADR.14 / RG-IMP-06). Rapproche les projections normalisées :
 * d'abord par `(providerId, providerKey)` (idempotence entre exécutions), puis par **signature
 * métier** (titre + date + lieu). Règles communes à tous les imports (RG-IMP-05).
 *
 * `dedupeWithinBatch` traite les doublons **au sein d'un même import**. Le rapprochement avec des
 * événements déjà connus (autres imports / catalogue) est fourni par l'orchestrateur via
 * `knownSignatures` / `knownKeys`.
 */
@Injectable()
export class DeduplicateStage {
  dedupe(
    drafts: NormalizedEvent[],
    known: { keys?: Set<string>; signatures?: Set<string> } = {},
  ): DedupeOutcome {
    const seenKeys = new Set<string>();
    const seenSignatures = new Set<string>();
    const knownKeys = known.keys ?? new Set<string>();
    const knownSignatures = known.signatures ?? new Set<string>();

    const kept: NormalizedEvent[] = [];
    const duplicates: NormalizedEvent[] = [];

    for (const draft of drafts) {
      const keyId = draft.providerKey ? `${draft.providerId}:${draft.providerKey}` : null;
      const isDuplicate =
        (keyId !== null && (seenKeys.has(keyId) || knownKeys.has(keyId))) ||
        seenSignatures.has(draft.signature) ||
        knownSignatures.has(draft.signature);

      if (isDuplicate) {
        duplicates.push(draft);
        continue;
      }
      if (keyId !== null) {
        seenKeys.add(keyId);
      }
      seenSignatures.add(draft.signature);
      kept.push(draft);
    }
    return { kept, duplicates };
  }
}
