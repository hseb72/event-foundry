import { Injectable } from '@nestjs/common';
import { ImportJobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import type { ImportJob, ImportJobWithAttachment } from '../entities/import-job.entity';

@Injectable()
export class ImportJobRepository extends BaseRepository<ImportJob> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<ImportJob> {
    return this.prisma.importJob as unknown as CrudDelegate<ImportJob>;
  }

  findByIdWithAttachment(id: string): Promise<ImportJobWithAttachment | null> {
    return this.prisma.importJob.findUnique({ where: { id }, include: { attachment: true } });
  }

  list(skip: number, take: number): Promise<ImportJobWithAttachment[]> {
    return this.prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { attachment: true },
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
  }): Promise<ImportJobWithAttachment> {
    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.attachment.create({ data: input.attachment });
      return tx.importJob.create({
        data: {
          attachmentId: attachment.id,
          status: input.status,
          correlationId: input.correlationId,
          ocrText: input.ocrText ?? null,
        },
        include: { attachment: true },
      });
    });
  }
}
