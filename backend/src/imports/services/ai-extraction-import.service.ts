import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ImportChannel, ImportJobStatus } from '@prisma/client';
import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { AiCallLogService } from '../../ai/ai-call-log.service';
import { AiConfigService } from '../../ai/ai-config.service';
import { MinioService } from '../../infra/minio/minio.service';
import type { ImportConnector } from '../connectors/import-connector';
import { IMPORT_CONNECTORS } from '../connectors/import-connector';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { PipelineRunnerService } from './pipeline-runner.service';

const AI_EXTRACTION_PROVIDER = 'ai-extraction';

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

  /** Extraction IA d'un document texte (compréhension de document — ADR.16). */
  async import(
    text: string,
    actor: { userId: string; organizationId: string | null },
  ): Promise<ImportJobWithAttachment> {
    const content = text?.trim() ?? '';
    if (!content) {
      throw new BadRequestException('Contenu vide.');
    }
    const assistant = await this.aiConfig.resolveForUseCase(
      actor.userId,
      actor.organizationId,
      'DOC_UNDERSTANDING',
    );
    if (!assistant) {
      throw new BadRequestException(
        'Aucune IA configurée pour la compréhension de documents. Activez le cas d’usage ' +
          '« DOC_UNDERSTANDING » dans la configuration IA, ou utilisez l’import texte déterministe.',
      );
    }
    const connector = this.resolveConnector();
    const correlationId = getCorrelationId() ?? generateCorrelationId();
    const job = await this.createJob(content, correlationId);

    try {
      await this.jobs.transition(job.id, ImportJobStatus.EXTRACTING, correlationId, {
        startedAt: new Date(),
      });

      // Extract = un seul appel IA → Raw Events structurés (libellés bruts). Journalisé (supervision).
      const startedAt = Date.now();
      let drafts;
      try {
        drafts = await connector.extract({ content, assistant });
        await this.aiCallLog.record({
          useCase: 'DOC_UNDERSTANDING',
          provider: assistant.provider,
          model: assistant.model,
          durationMs: Date.now() - startedAt,
          status: 'SUCCESS',
          correlationId,
        });
      } catch (aiError) {
        await this.aiCallLog.record({
          useCase: 'DOC_UNDERSTANDING',
          provider: assistant.provider,
          model: assistant.model,
          durationMs: Date.now() - startedAt,
          status: 'FAILED',
          correlationId,
        });
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
      await this.jobs.transition(job.id, ImportJobStatus.FAILED, correlationId, {
        finishedAt: new Date(),
      });
      throw error;
    }
  }

  private resolveConnector(): ImportConnector {
    const connector = this.connectors.find((c) => c.providerId === AI_EXTRACTION_PROVIDER);
    if (!connector) {
      throw new BadRequestException('Connecteur d’extraction IA indisponible.');
    }
    return connector;
  }

  private async createJob(content: string, correlationId: string): Promise<ImportJobWithAttachment> {
    const attachmentId = randomUUID();
    const buffer = Buffer.from(content, 'utf-8');
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}.txt`;

    await this.minio.putObject(storageKey, buffer, 'text/plain; charset=utf-8');

    return this.jobs.createWithAttachment({
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
      status: ImportJobStatus.PENDING,
      correlationId,
      channel: ImportChannel.TEXT,
      providerId: AI_EXTRACTION_PROVIDER,
    });
  }
}
