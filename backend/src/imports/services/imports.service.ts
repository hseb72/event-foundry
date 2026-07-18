import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportJobStatus } from '@prisma/client';
import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { MinioService } from '../../infra/minio/minio.service';
import { QueueService } from '../../infra/queue/queue.service';
import type { ImportJobDetail, ImportJobWithAttachment } from '../entities/import-job.entity';
import { ImportJobNotFoundException } from '../exceptions/import-job-not-found.exception';
import { UnsupportedFileTypeException } from '../exceptions/unsupported-file-type.exception';
import { ALLOWED_UPLOAD_MIME_TYPES } from '../imports.constants';
import { ImportJobRepository } from '../repositories/import-job.repository';

/**
 * Orchestration de l'acquisition (TSPEC.06). Le Backend stocke le document dans MinIO,
 * crée l'Attachment + l'ImportJob, publie le Job BullMQ, puis rend la main immédiatement
 * (le frontend n'attend jamais la fin du traitement). Aucun OCR ni classification ici.
 */
@Injectable()
export class ImportsService {
  constructor(
    private readonly repository: ImportJobRepository,
    private readonly minio: MinioService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  list(skip: number, take: number): Promise<ImportJobWithAttachment[]> {
    return this.repository.list(skip, take);
  }

  async getDetailOrThrow(id: string): Promise<ImportJobDetail> {
    const job = await this.repository.findDetailById(id);
    if (!job) {
      throw new ImportJobNotFoundException(id);
    }
    return job;
  }

  /** Import d'un fichier (image/PDF) : déclenche l'OCR. */
  async importFile(file: Express.Multer.File): Promise<ImportJobWithAttachment> {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedFileTypeException(file.mimetype);
    }
    // UUID généré côté application : la clé MinIO est déterministe, ce qui permet à
    // l'OCR Worker de charger le document sans accès à PostgreSQL (TSPEC.04, ADR.07).
    const correlationId = getCorrelationId() ?? generateCorrelationId();
    const attachmentId = randomUUID();
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}`;

    await this.minio.putObject(storageKey, file.buffer, file.mimetype);

    const job = await this.repository.createWithAttachment({
      attachment: {
        id: attachmentId,
        type: 'IMAGE',
        originalName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        checksum,
        storageBucket: this.minio.bucketName,
        storageKey,
      },
      status: 'PENDING',
      correlationId,
    });

    await this.queue.enqueueImport({
      importJobId: job.id,
      attachmentId: job.attachmentId,
      correlationId,
    });

    // Le job entre dans l'étape OCR : transition historisée (le Backend orchestre chaque
    // étape et enregistre les passages d'état). L'OCR Worker renverra son OCRResult au
    // Backend, qui poursuivra le pipeline.
    const startedAt = new Date();
    await this.repository.transition(job.id, ImportJobStatus.OCR_RUNNING, correlationId, {
      startedAt,
    });
    job.status = ImportJobStatus.OCR_RUNNING;
    job.startedAt = startedAt;

    return job;
  }

  /** Import de texte : aucun OCR, classification directe (FSPEC.01 RM-007). */
  async importText(text: string): Promise<ImportJobWithAttachment> {
    const correlationId = getCorrelationId() ?? generateCorrelationId();
    const attachmentId = randomUUID();
    const buffer = Buffer.from(text, 'utf-8');
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}.txt`;

    await this.minio.putObject(storageKey, buffer, 'text/plain; charset=utf-8');

    const job = await this.repository.createWithAttachment({
      attachment: {
        id: attachmentId,
        type: 'TEXT',
        originalName: null,
        contentType: 'text/plain',
        sizeBytes: buffer.length,
        checksum,
        storageBucket: this.minio.bucketName,
        storageKey,
      },
      status: 'PENDING',
      correlationId,
      ocrText: text,
    });

    // Import texte : aucun OCR (RM-007). Le Backend fabrique un OCRResult de substitution
    // et passe directement à la classification, en historisant la transition.
    await this.queue.enqueueClassification({
      importJobId: job.id,
      rawText: text,
      confidence: 1,
      processingTimeMs: 0,
      pageCount: 1,
      language: this.config.get<string>('OCR_LANGUAGES', 'und'),
      engine: 'text-passthrough',
      engineVersion: '1',
      correlationId,
    });

    const startedAt = new Date();
    await this.repository.transition(
      job.id,
      ImportJobStatus.CLASSIFICATION_RUNNING,
      correlationId,
      { startedAt },
    );
    job.status = ImportJobStatus.CLASSIFICATION_RUNNING;
    job.startedAt = startedAt;

    return job;
  }
}
