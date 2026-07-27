import type { Event, Prisma, UserParticipation } from '@prisma/client';

export type { Event, UserParticipation };

export const EVENT_REFS_INCLUDE = {
  activity: true,
  eventType: true,
  organizer: true,
  venue: true,
  municipality: { include: { region: { include: { country: true } } } },
  formats: { include: { eventFormat: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  // Pseudo de l'auteur : exposé uniquement dans la vue d'organisation (FSPEC.22), jamais en découverte.
  createdBy: { select: { displayName: true } },
} as const;

/** Event avec ses référentiels chargés (pour l'exposition via DTO). */
export type EventWithRefs = Prisma.EventGetPayload<{ include: typeof EVENT_REFS_INCLUDE }>;

/** Event avec ses référentiels + les participations (filtrées à l'utilisateur courant). */
export type EventWithRefsAndParticipation = Prisma.EventGetPayload<{
  include: typeof EVENT_REFS_INCLUDE & { participations: true };
}>;
