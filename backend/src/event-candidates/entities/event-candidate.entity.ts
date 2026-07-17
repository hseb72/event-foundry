import type { EventCandidate, Prisma } from '@prisma/client';

export type { EventCandidate };

/** EventCandidate avec son ImportJob (et l'Attachment) — pour le détail de revue. */
export type EventCandidateWithImport = Prisma.EventCandidateGetPayload<{
  include: { importJob: { include: { attachment: true } } };
}>;
