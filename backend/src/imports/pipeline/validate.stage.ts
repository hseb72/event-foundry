import { Injectable } from '@nestjs/common';
import type { RawEvent } from '@event-foundry/contracts';
import type { ValidationOutcome } from './pipeline.types';
import { readField, parseDate } from './field-access';

/**
 * Étape **Validate** du pipeline (ADR.14 / RG-IMP-06). Vérifie la cohérence minimale d'un Raw Event
 * (titre présent, date de début parseable). **Rejette** sans corriger — aucune interprétation métier.
 * Déterministe : mêmes entrées → mêmes rejets (RG-IMP-05).
 */
@Injectable()
export class ValidateStage {
  validate(rawEvents: RawEvent[]): ValidationOutcome {
    const valid: RawEvent[] = [];
    const rejected: { rawEvent: RawEvent; reason: string }[] = [];

    for (const rawEvent of rawEvents) {
      const title = readField(rawEvent.payload, ['title', 'titre', 'name']);
      const startsAt = readField(rawEvent.payload, ['starts_at', 'startsAt', 'start', 'date', 'startDate']);
      if (!title || title.trim().length === 0) {
        rejected.push({ rawEvent, reason: 'Titre manquant.' });
        continue;
      }
      if (!startsAt || parseDate(startsAt) === null) {
        rejected.push({ rawEvent, reason: 'Date de début manquante ou invalide.' });
        continue;
      }
      valid.push(rawEvent);
    }
    return { valid, rejected };
  }
}
