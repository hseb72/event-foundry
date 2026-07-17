import type { Event, Prisma } from '@prisma/client';

export type { Event };

export const EVENT_REFS_INCLUDE = {
  activity: true,
  eventType: true,
  eventFormat: true,
  organizer: true,
  venue: true,
} as const;

/** Event avec ses référentiels chargés (pour l'exposition via DTO). */
export type EventWithRefs = Prisma.EventGetPayload<{ include: typeof EVENT_REFS_INCLUDE }>;
