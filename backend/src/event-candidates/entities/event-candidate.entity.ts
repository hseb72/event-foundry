import type { EventCandidate, Prisma } from '@prisma/client';

export type { EventCandidate };

/** EventCandidate avec son ImportJob (et l'Attachment) — pour le détail de revue. */
export type EventCandidateWithImport = Prisma.EventCandidateGetPayload<{
  include: { importJob: { include: { attachment: true } } };
}>;

/**
 * EventCandidate enrichi du pseudo de l'auteur de la soumission (FSPEC.22 — vue d'organisation).
 * L'équipe voit qui a soumis chaque brouillon à qualifier.
 */
export type EventCandidateWithCreator = Prisma.EventCandidateGetPayload<{
  include: { importJob: { include: { createdBy: { select: { displayName: true } } } } };
}>;
