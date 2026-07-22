/**
 * Événement métier interne (ADR.12 §5 — architecture événementielle). Les domaines communiquent
 * prioritairement via ces événements, ce qui limite les dépendances directes (un nouveau canal de
 * notification s'abonne sans modifier les producteurs — Principe 6). Immuable et tracé (Principe 7).
 */
export interface DomainEvent<TPayload = Record<string, unknown>> {
  /** Nom canonique de l'événement (ex. `import.completed`). */
  name: string;
  /** Date d'émission (ISO 8601 UTC). */
  occurredAt: string;
  /** Corrélation propagée depuis la requête / le pipeline (traçabilité). */
  correlationId: string;
  /** Données de l'événement — **faits**, jamais d'ordre (le producteur ne décide pas des réactions). */
  payload: TPayload;
}

/** Registre des noms d'événements métier (ADR.12 §5). Étendu sans modifier le cœur. */
export const DOMAIN_EVENTS = {
  IMPORT_COMPLETED: 'import.completed',
  IMPORT_FAILED: 'import.failed',
  EVENT_PUBLISHED: 'event.published',
  PARTICIPATION_CHANGED: 'participation.changed',
} as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

// Payloads en `type` (et non `interface`) pour être assignables à `Record<string, unknown>`.

/** Fin d'un import (tous canaux) : volumétrie du pipeline. */
export type ImportCompletedPayload = {
  importJobId: string;
  channel: string | null;
  providerId: string | null;
  createdCount: number;
  duplicateCount: number;
  rejectedCount: number;
};

/** Échec d'un import. */
export type ImportFailedPayload = {
  importJobId: string;
  reason: string;
};

/** Un Event est passé au statut PUBLISHED. Porte les cibles de suivi (pour notifier les abonnés). */
export type EventPublishedPayload = {
  eventId: string;
  title: string;
  actorId: string | null;
  /** Première publication (≠ re-publication) : seule à informer les abonnés Follow. */
  firstPublish: boolean;
  organizerId: string | null;
  activityId: string;
  categoryId: string | null;
  venueId: string | null;
};

/** La participation d'un utilisateur à un Event a changé (axes ou activation). */
export type ParticipationChangedPayload = {
  userId: string;
  eventId: string;
  interested: boolean;
  reservationStatus: string;
  paymentStatus: string;
  active: boolean;
};
