import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { MinioService } from '../../infra/minio/minio.service';
import { QueueService } from '../../infra/queue/queue.service';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
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

  async getDetailOrThrow(id: string): Promise<ImportJobWithAttachment> {
    const job = await this.repository.findByIdWithAttachment(id);
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
    const correlationId = generateCorrelationId();
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

    return job;
  }

  /** Import de texte : aucun OCR, classification directe (FSPEC.01 RM-007). */
  async importText(text: string): Promise<ImportJobWithAttachment> {
    const correlationId = generateCorrelationId();
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
      status: 'OCR_DONE',
      correlationId,
      ocrText: text,
    });

    // OCRResult de substitution : le texte importé est directement classé.
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

    return job;
  }
}
