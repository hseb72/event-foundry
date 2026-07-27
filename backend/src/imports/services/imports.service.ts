import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportJobStatus } from '@prisma/client';
import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { AiConfigService } from '../../ai/ai-config.service';
import { MinioService } from '../../infra/minio/minio.service';
import { QueueService } from '../../infra/queue/queue.service';
import { TechnicalConfigService } from '../../platform-config/technical-config.service';
import type { OcrAssistant } from '@event-foundry/contracts';
import type { ImportJobDetail, ImportJobWithAttachment } from '../entities/import-job.entity';
import { FileTooLargeException } from '../exceptions/file-too-large.exception';
import { ImportJobNotFoundException } from '../exceptions/import-job-not-found.exception';
import { ImportQuotaExceededException } from '../exceptions/import-quota-exceeded.exception';
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
    private readonly aiConfig: AiConfigService,
    private readonly technical: TechnicalConfigService,
  ) {}

  list(skip: number, take: number): Promise<ImportJobWithAttachment[]> {
    return this.repository.list(skip, take);
  }

  /** Soumissions de l'utilisateur courant (FSPEC.22 §6 — espace personnel). */
  listForUser(userId: string, skip: number, take: number): Promise<ImportJobWithAttachment[]> {
    return this.repository.listForUser(userId, skip, take);
  }

  async getDetailOrThrow(id: string): Promise<ImportJobDetail> {
    const job = await this.repository.findDetailById(id);
    if (!job) {
      throw new ImportJobNotFoundException(id);
    }
    return job;
  }

  /** Détail d'une soumission restreinte à son auteur (FSPEC.22 §6). */
  async getDetailForUserOrThrow(id: string, userId: string): Promise<ImportJobDetail> {
    const job = await this.repository.findDetailByIdForUser(id, userId);
    if (!job) {
      throw new ImportJobNotFoundException(id);
    }
    return job;
  }

  /** Import d'un fichier (image/PDF) : déclenche l'OCR (assisté par IA si configuré). */
  async importFile(
    file: Express.Multer.File,
    actor?: { userId: string; organizationId: string | null },
  ): Promise<ImportJobWithAttachment> {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedFileTypeException(file.mimetype);
    }
    // Limites techniques configurables (OPE-005) : taille d'upload puis plafond quotidien.
    const limits = await this.technical.getLimits();
    if (file.size > limits.maxUploadBytes) {
      throw new FileTooLargeException(file.size, limits.maxUploadBytes);
    }
    await this.enforceDailyQuota(limits.maxImportsPerDay);
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
      createdById: actor?.userId ?? null,
    });

    // 1er cas d'usage IA (ADR.16) : si une IA « OCR » est configurée pour l'utilisateur/organisation,
    // le Backend la résout (le Worker est découplé de PostgreSQL et ne peut pas résoudre les secrets)
    // et la passe au Worker. Sinon, OCR interne déterministe (Tesseract).
    const ocrAssistant = actor ? await this.resolveOcrAssistant(actor) : undefined;

    await this.queue.enqueueImport({
      importJobId: job.id,
      attachmentId: job.attachmentId,
      correlationId,
      ...(ocrAssistant ? { ocrAssistant } : {}),
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

  /**
   * Résout l'assistant IA pour le cas d'usage « OCR » (fallback organisation → utilisateur →
   * plateforme). Retourne `undefined` si aucun n'est activé → repli sur l'OCR interne (RG-AI-06).
   */
  private async resolveOcrAssistant(actor: {
    userId: string;
    organizationId: string | null;
  }): Promise<OcrAssistant | undefined> {
    const resolved = await this.aiConfig.resolveForUseCase(actor.userId, actor.organizationId, 'OCR');
    return resolved
      ? { provider: resolved.provider, model: resolved.model, apiKey: resolved.apiKey }
      : undefined;
  }

  /**
   * Vérifie le plafond quotidien d'imports plateforme (OPE-005). `0` = illimité. Le compteur porte
   * sur les imports créés depuis le début de la journée (UTC).
   */
  private async enforceDailyQuota(maxImportsPerDay: number): Promise<void> {
    if (maxImportsPerDay <= 0) {
      return;
    }
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const count = await this.repository.countSince(startOfDay);
    if (count >= maxImportsPerDay) {
      throw new ImportQuotaExceededException(maxImportsPerDay);
    }
  }

  /** Import de texte : aucun OCR, classification directe (FSPEC.01 RM-007). */
  async importText(text: string, createdById?: string | null): Promise<ImportJobWithAttachment> {
    await this.enforceDailyQuota((await this.technical.getLimits()).maxImportsPerDay);
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
      createdById: createdById ?? null,
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
