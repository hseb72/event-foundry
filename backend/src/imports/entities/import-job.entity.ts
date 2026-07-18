import type { Attachment, ImportJob, Prisma } from '@prisma/client';

export type { Attachment, ImportJob };

/** ImportJob avec son Attachment et le nombre de candidates (confiné à la couche Repository). */
export type ImportJobWithAttachment = Prisma.ImportJobGetPayload<{
  include: { attachment: true; _count: { select: { candidates: true } } };
}>;

/** Détail d'un ImportJob : Attachment, comptage et journal des transitions (import_job_events). */
export type ImportJobDetail = Prisma.ImportJobGetPayload<{
  include: {
    attachment: true;
    _count: { select: { candidates: true } };
    events: true;
  };
}>;
