import { Injectable } from '@nestjs/common';
import { ImportJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import type { ImportJob, ImportJobDetail, ImportJobWithAttachment } from '../entities/import-job.entity';

@Injectable()
export class ImportJobRepository extends BaseRepository<ImportJob> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<ImportJob> {
    return this.prisma.importJob as unknown as CrudDelegate<ImportJob>;
  }

  findByIdWithAttachment(id: string): Promise<ImportJobWithAttachment | null> {
    return this.prisma.importJob.findUnique({
      where: { id },
      include: { attachment: true, _count: { select: { candidates: true } } },
    });
  }

  /** Détail avec le journal des transitions ordonné chronologiquement. */
  findDetailById(id: string): Promise<ImportJobDetail | null> {
    return this.prisma.importJob.findUnique({
      where: { id },
      include: {
        attachment: true,
        _count: { select: { candidates: true } },
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
  }

  /** Nombre d'imports créés depuis `since` (plafond quotidien plateforme — OPE-005). */
  countSince(since: Date): Promise<number> {
    return this.prisma.importJob.count({ where: { createdAt: { gte: since } } });
  }

  list(skip: number, take: number): Promise<ImportJobWithAttachment[]> {
    return this.prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { attachment: true, _count: { select: { candidates: true } } },
    });
  }

  /**
   * Crée l'Attachment puis l'ImportJob dans une transaction (écriture multi-cohérente,
   * CLAUDE.md §6). Aucun traitement asynchrone n'est inclus dans la transaction.
   */
  createWithAttachment(input: {
    attachment: Prisma.AttachmentCreateInput;
    status: ImportJobStatus;
    correlationId: string;
    ocrText?: string | null;
    channel?: Prisma.ImportJobCreateInput['channel'];
    providerId?: string | null;
  }): Promise<ImportJobWithAttachment> {
    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.create({ data: input.attachment });
      const job = await tx.importJob.create({
        data: {
          attachmentId: attachment.id,
          status: input.status,
          correlationId: input.correlationId,
          ocrText: input.ocrText ?? null,
          channel: input.channel ?? null,
          providerId: input.providerId ?? null,
        },
        include: { attachment: true, _count: { select: { candidates: true } } },
      });
      // Première entrée du journal des transitions (état initial).
      await tx.importJobEvent.create({
        data: { importJobId: job.id, status: job.status, correlationId: job.correlationId },
      });
      return job;
    });
  }

  /**
   * Applique une transition d'état et l'historise atomiquement (écriture multi-cohérente,
   * CLAUDE.md §6). `data` porte les champs métier associés à l'étape (ex. timestamps,
   * métadonnées OCR). L'historique alimente les statistiques sur les passages entre états.
   */
  transition(
    id: string,
    status: ImportJobStatus,
    correlationId: string,
    data: Prisma.ImportJobUpdateInput = {},
  ): Promise<ImportJob> {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.importJob.update({ where: { id }, data: { ...data, status } });
      await tx.importJobEvent.create({ data: { importJobId: id, status, correlationId } });
      return job;
    });
  }
}
