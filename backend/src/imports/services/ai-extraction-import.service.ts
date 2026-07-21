import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ImportChannel, ImportJobStatus } from '@prisma/client';
import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { AiCallLogService } from '../../ai/ai-call-log.service';
import { AiConfigService, type ResolvedAssistant } from '../../ai/ai-config.service';
import { MinioService } from '../../infra/minio/minio.service';
import type { ImportConnector } from '../connectors/import-connector';
import { IMPORT_CONNECTORS } from '../connectors/import-connector';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { PipelineRunnerService } from './pipeline-runner.service';

const AI_EXTRACTION_PROVIDER = 'ai-extraction';
const VISION_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

/**
 * Canal **extraction assistée par IA** (ADR.16 §Frontière). Le Backend résout l'assistant IA
 * (fallback organisation → utilisateur → plateforme), l'IA remplit un Raw Event structuré (libellés
 * bruts), puis le pipeline commun décide de façon **déterministe**. L'appel IA est journalisé pour la
 * supervision (Observabilité). Si aucune IA n'est configurée, l'extraction IA n'est pas disponible.
 */
@Injectable()
export class AiExtractionImportService {
  constructor(
    private readonly jobs: ImportJobRepository,
    private readonly pipeline: ImportPipelineRepository,
    private readonly minio: MinioService,
    private readonly runner: PipelineRunnerService,
    private readonly aiConfig: AiConfigService,
    private readonly aiCallLog: AiCallLogService,
    @Inject(IMPORT_CONNECTORS) private readonly connectors: ImportConnector[],
  ) {}

  /** Extraction IA d'un document **texte** (compréhension de document — ADR.16). */
  async import(
    text: string,
    actor: { userId: string; organizationId: string | null },
  ): Promise<ImportJobWithAttachment> {
    const content = text?.trim() ?? '';
    if (!content) {
      throw new BadRequestException('Contenu vide.');
    }
    const assistant = await this.requireAssistant(actor);
    const buffer = Buffer.from(content, 'utf-8');
    const job = await this.createJob(buffer, 'text/plain', ImportChannel.TEXT, 'txt', null);
    return this.process(job, { content, assistant }, assistant);
  }

  /** Extraction IA d'une **image** (affiche / photo — vision). Même pipeline déterministe en aval. */
  async importFile(
    file: Express.Multer.File,
    actor: { userId: string; organizationId: string | null },
  ): Promise<ImportJobWithAttachment> {
    if (!VISION_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Format non supporté pour l’extraction IA : ${file.mimetype}. Formats : PNG, JPEG.`,
      );
    }
    const assistant = await this.requireAssistant(actor);
    const job = await this.createJob(file.buffer, file.mimetype, ImportChannel.IMAGE, 'img', file.originalname);
    return this.process(
      job,
      { content: '', image: { base64: file.buffer.toString('base64'), mediaType: file.mimetype }, assistant },
      assistant,
    );
  }

  /** Étapes communes : Extract (1 appel IA, journalisé) → Raw Events → pipeline déterministe. */
  private async process(
    job: ImportJobWithAttachment,
    extractInput: { content: string; image?: { base64: string; mediaType: string }; assistant: ResolvedAssistant },
    assistant: ResolvedAssistant,
  ): Promise<ImportJobWithAttachment> {
    const connector = this.resolveConnector();
    const correlationId = job.correlationId;
    try {
      await this.jobs.transition(job.id, ImportJobStatus.EXTRACTING, correlationId, { startedAt: new Date() });

      const startedAt = Date.now();
      let drafts;
      try {
        drafts = await connector.extract(extractInput);
        await this.logCall(assistant, Date.now() - startedAt, 'SUCCESS', correlationId);
      } catch (aiError) {
        await this.logCall(assistant, Date.now() - startedAt, 'FAILED', correlationId);
        throw aiError;
      }

      const rawEvents = await this.pipeline.createRawEvents(
        job.id,
        correlationId,
        drafts.map((draft) => ({
          providerId: connector.providerId,
          providerKey: draft.providerKey,
          connectorVersion: connector.version,
          payload: draft.payload,
          mediaRefs: draft.mediaRefs ?? [],
        })),
      );

      // Décision déterministe : Validate → Normalize (résolution référentiels) → Deduplicate → Persist.
      await this.runner.run({
        importJobId: job.id,
        providerId: connector.providerId,
        correlationId,
        rawEvents,
        objectsRead: drafts.length,
      });

      job.status = ImportJobStatus.READY_FOR_VALIDATION;
      return job;
    } catch (error) {
      await this.jobs.transition(job.id, ImportJobStatus.FAILED, correlationId, { finishedAt: new Date() });
      throw error;
    }
  }

  private async requireAssistant(actor: {
    userId: string;
    organizationId: string | null;
  }): Promise<ResolvedAssistant> {
    const assistant = await this.aiConfig.resolveForUseCase(actor.userId, actor.organizationId, 'DOC_UNDERSTANDING');
    if (!assistant) {
      throw new BadRequestException(
        'Aucune IA configurée pour la compréhension de documents. Activez le cas d’usage ' +
          '« DOC_UNDERSTANDING » dans la configuration IA, ou utilisez l’import déterministe.',
      );
    }
    return assistant;
  }

  private logCall(
    assistant: ResolvedAssistant,
    durationMs: number,
    status: 'SUCCESS' | 'FAILED',
    correlationId: string,
  ): Promise<void> {
    return this.aiCallLog.record({
      useCase: 'DOC_UNDERSTANDING',
      provider: assistant.provider,
      model: assistant.model,
      durationMs,
      status,
      correlationId,
    });
  }

  private resolveConnector(): ImportConnector {
    const connector = this.connectors.find((c) => c.providerId === AI_EXTRACTION_PROVIDER);
    if (!connector) {
      throw new BadRequestException('Connecteur d’extraction IA indisponible.');
    }
    return connector;
  }

  private async createJob(
    buffer: Buffer,
    contentType: string,
    channel: ImportChannel,
    ext: string,
    originalName: string | null,
  ): Promise<ImportJobWithAttachment> {
    const attachmentId = randomUUID();
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}.${ext}`;
    const correlationId = getCorrelationId() ?? generateCorrelationId();

    await this.minio.putObject(storageKey, buffer, contentType);

    return this.jobs.createWithAttachment({
      attachment: {
        id: attachmentId,
        type: channel === ImportChannel.IMAGE ? 'IMAGE' : 'TEXT',
        originalName: originalName ? originalName.slice(0, 255) : null,
        contentType,
        sizeBytes: buffer.length,
        checksum,
        storageBucket: this.minio.bucketName,
        storageKey,
      },
      status: ImportJobStatus.PENDING,
      correlationId,
      channel,
      providerId: AI_EXTRACTION_PROVIDER,
    });
  }
}
