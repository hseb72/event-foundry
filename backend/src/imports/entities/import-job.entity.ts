import type { Attachment, ImportJob, Prisma } from '@prisma/client';

export type { Attachment, ImportJob };

/** ImportJob avec son Attachment et le nombre de candidates (confiné à la couche Repository). */
export type ImportJobWithAttachment = Prisma.ImportJobGetPayload<{
  include: { attachment: true; _count: { select: { candidates: true } } };
}>;
