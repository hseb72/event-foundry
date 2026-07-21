import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import type { DomainEvent } from './domain-event';

/** Jeton d'injection du bus d'événements (dépendance à l'abstraction — ADR.07/ADR.12). */
export const EVENT_BUS = Symbol('EVENT_BUS');

/** Abonné à un événement métier. Peut être asynchrone ; une erreur est isolée par le bus. */
export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

/** Nom spécial : s'abonner à **tous** les événements (audit, journalisation). */
export const ALL_EVENTS = '*';

/**
 * Bus d'événements métier interne (ADR.12 §5). Les producteurs **publient un fait** ; ils ne
 * connaissent pas leurs abonnés. La publication est **best-effort et non bloquante** : elle ne casse
 * jamais le producteur. Abstraction volontairement neutre vis-à-vis du transport (in-process
 * aujourd'hui ; un transport distribué pourra la remplacer sans toucher les domaines).
 */
export interface EventBus {
  publish(event: DomainEvent): void;
  subscribe(name: string, handler: DomainEventHandler): void;
}

/**
 * Fabrique un `DomainEvent` en renseignant automatiquement `occurredAt` (UTC) et `correlationId`
 * (celui de la requête courante s'il existe, sinon généré). Centralise la forme des événements.
 */
export function makeDomainEvent<TPayload extends Record<string, unknown>>(
  name: string,
  payload: TPayload,
  correlationId?: string,
): DomainEvent<TPayload> {
  return {
    name,
    occurredAt: new Date().toISOString(),
    correlationId: correlationId ?? getCorrelationId() ?? generateCorrelationId(),
    payload,
  };
}
