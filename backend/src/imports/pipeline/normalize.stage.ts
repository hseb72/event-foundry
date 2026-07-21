import { Injectable } from '@nestjs/common';
import type { ConfidenceByField, ExtractedEventFields, RawEvent } from '@event-foundry/contracts';
import type { NormalizedEvent } from './pipeline.types';
import { parseDate, parseNumber, readField } from './field-access';

/** Champs `ExtractedEventFields` de type chaîne (les seuls alimentés par simple recopie). */
type StringField = 'title' | 'description' | 'activity' | 'eventType' | 'eventFormat' | 'organizer' | 'venue' | 'city' | 'currency' | 'url';

/** Table d'alias source → champ commun (harmonisation de format, aucune décision métier). */
const FIELD_ALIASES: { field: StringField; keys: string[] }[] = [
  { field: 'title', keys: ['title', 'titre'] },
  { field: 'description', keys: ['description', 'desc'] },
  { field: 'activity', keys: ['activity', 'activite', 'activité'] },
  { field: 'eventType', keys: ['event_type', 'eventType', 'type'] },
  { field: 'eventFormat', keys: ['event_format', 'eventFormat', 'format'] },
  { field: 'organizer', keys: ['organizer', 'organisateur'] },
  { field: 'venue', keys: ['venue', 'lieu'] },
  { field: 'city', keys: ['city', 'ville'] },
  { field: 'currency', keys: ['currency', 'devise'] },
  { field: 'url', keys: ['url', 'lien', 'link'] },
];

/**
 * Étape **Normalize** du pipeline (ADR.14/15) : seul point de passage Raw Event → modèle commun.
 * Harmonise les formats (dates ISO/UTC, nombres) et projette les champs source vers la forme
 * `ExtractedEventFields` (noms de référentiels), **sans interprétation métier** — pour un canal
 * structuré, les champs sont fournis explicitement. La résolution des noms vers des IDs de
 * référentiels reste à la charge du domaine (validation / classifier), jamais du connecteur.
 *
 * Déterministe : la confiance d'un champ fourni par une source structurée vaut 1 (RG-IMP-05).
 */
@Injectable()
export class NormalizeStage {
  normalize(rawEvent: RawEvent): NormalizedEvent {
    const payload = rawEvent.payload;
    const fields: ExtractedEventFields = {};
    const confidence: ConfidenceByField = {};

    for (const { field, keys } of FIELD_ALIASES) {
      const value = readField(payload, keys);
      if (value !== undefined) {
        fields[field] = value;
        confidence[field] = 1;
      }
    }

    const startsAt = parseDate(readField(payload, ['starts_at', 'startsAt', 'start', 'date']));
    if (startsAt) {
      fields.startsAt = startsAt;
      confidence.startsAt = 1;
    }
    const endsAt = parseDate(readField(payload, ['ends_at', 'endsAt', 'end']));
    if (endsAt) {
      fields.endsAt = endsAt;
      confidence.endsAt = 1;
    }
    const price = parseNumber(readField(payload, ['price', 'prix', 'tarif']));
    if (price !== undefined) {
      fields.price = price;
      confidence.price = 1;
    }

    return {
      rawEventId: rawEvent.id,
      providerId: rawEvent.providerId,
      providerKey: rawEvent.providerKey,
      fields,
      confidence,
      signature: this.signature(fields),
    };
  }

  /** Signature métier de rapprochement (titre + date + lieu), insensible à la casse/aux espaces. */
  private signature(fields: ExtractedEventFields): string {
    const norm = (value?: string): string => (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    return [norm(fields.title), fields.startsAt ?? '', norm(fields.venue ?? fields.city)].join('|');
  }
}
