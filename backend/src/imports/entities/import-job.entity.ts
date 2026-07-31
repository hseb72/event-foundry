import type { Attachment, ImportJob, Prisma } from '@prisma/client';

export type { Attachment, ImportJob };

/** ImportJob avec son Attachment et le nombre de candidates (confiné à la couche Repository). */
export type ImportJobWithAttachment = Prisma.ImportJobGetPayload<{
  include: { attachment: true; _count: { select: { candidates: true } } };
}>;

/**
 * ImportJob enrichi du pseudo de l'auteur (FSPEC.22 — vue d'organisation). Chaque agent d'une
 * organisation voit qui a soumis quoi, pour savoir s'il est opportun d'agir sur la soumission d'un
 * collègue (absence, départ…). L'auteur est nullable (jobs système / auteur supprimé).
 */
export type ImportJobWithCreator = Prisma.ImportJobGetPayload<{
  include: {
    attachment: true;
    _count: { select: { candidates: true } };
    createdBy: { select: { displayName: true } };
  };
}>;

/** Détail d'un ImportJob : Attachment, comptage et journal des transitions (import_job_events). */
export type ImportJobDetail = Prisma.ImportJobGetPayload<{
  include: {
    attachment: true;
    _count: { select: { candidates: true } };
    events: true;
  };
}>;
