import type { Attachment, ImportJob, Prisma } from '@prisma/client';

export type { Attachment, ImportJob };

/** ImportJob avec son Attachment chargé (confiné à la couche Repository). */
export type ImportJobWithAttachment = Prisma.ImportJobGetPayload<{
  include: { attachment: true };
}>;
