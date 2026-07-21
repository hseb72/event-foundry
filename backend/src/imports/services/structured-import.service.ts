import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ImportChannel, ImportJobStatus } from '@prisma/client';
import { generateCorrelationId, getCorrelationId } from '@event-foundry/libraries';
import { createHash, randomUUID } from 'node:crypto';
import { MinioService } from '../../infra/minio/minio.service';
import type { ImportConnector } from '../connectors/import-connector';
import { IMPORT_CONNECTORS } from '../connectors/import-connector';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { PipelineRunnerService } from './pipeline-runner.service';

/**
 * Pipeline d'import unifié pour les canaux **structurés déterministes** (CSV / JSON — ADR.13/14).
 * Orchestre les étapes du framework : Extract (connecteur) → Raw Events (conservés) → Validate →
 * Normalize → Deduplicate → Persist. Aucune IA, aucune décision métier dans le connecteur ; la
 * sortie (EventCandidates) part en **validation humaine** (RG-IMP-06, sources REVIEW). Chaque
 * transition d'`ImportJob` est historisée (audit + supervision).
 */
@Injectable()
export class StructuredImportService {
  constructor(
    private readonly jobs: ImportJobRepository,
    private readonly pipeline: ImportPipelineRepository,
    private readonly minio: MinioService,
    private readonly runner: PipelineRunnerService,
    @Inject(IMPORT_CONNECTORS) private readonly connectors: ImportConnector[],
  ) {}

  /** Import structuré à la demande (upload ou copier-coller). Rend la main après COMPLETED/FAILED. */
  async import(content: string, contentType?: string | null): Promise<ImportJobWithAttachment> {
    const trimmed = content?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException('Contenu vide : fournissez un fichier CSV/JSON ou collez son contenu.');
    }
    const channel = this.detectChannel(trimmed, contentType);
    const connector = this.resolveConnector(channel);
    const correlationId = getCorrelationId() ?? generateCorrelationId();

    const job = await this.createJob(trimmed, contentType, channel, connector.providerId, correlationId);

    try {
      // Extract — le connecteur ne produit que des ébauches de Raw Event (fidèles, sans décision).
      await this.jobs.transition(job.id, ImportJobStatus.EXTRACTING, correlationId, {
        startedAt: new Date(),
      });
      const drafts = await connector.extract({ content: trimmed, contentType });
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

      // Validate → Normalize → Deduplicate → Persist (étapes communes du pipeline).
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

  private detectChannel(content: string, contentType?: string | null): ImportChannel {
    if (contentType?.includes('json')) {
      return ImportChannel.JSON;
    }
    if (contentType?.includes('csv')) {
      return ImportChannel.CSV;
    }
    const first = content[0];
    return first === '[' || first === '{' ? ImportChannel.JSON : ImportChannel.CSV;
  }

  private resolveConnector(channel: ImportChannel): ImportConnector {
    // CSV et JSON sont servis par le même connecteur structuré (détection interne du format).
    const connector = this.connectors.find(
      (c) => c.channel === channel || (channel === ImportChannel.JSON && c.channel === ImportChannel.CSV),
    );
    if (!connector) {
      throw new BadRequestException(`Aucun connecteur pour le canal ${channel}.`);
    }
    return connector;
  }

  private async createJob(
    content: string,
    contentType: string | null | undefined,
    channel: ImportChannel,
    providerId: string,
    correlationId: string,
  ): Promise<ImportJobWithAttachment> {
    // Le contenu source est conservé dans MinIO (jamais en base) et référencé par un Attachment.
    const attachmentId = randomUUID();
    const buffer = Buffer.from(content, 'utf-8');
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}.${channel === ImportChannel.JSON ? 'json' : 'csv'}`;
    const mime = contentType ?? (channel === ImportChannel.JSON ? 'application/json' : 'text/csv');

    await this.minio.putObject(storageKey, buffer, mime);

    return this.jobs.createWithAttachment({
      attachment: {
        id: attachmentId,
        type: 'TEXT',
        originalName: null,
        contentType: mime,
        sizeBytes: buffer.length,
        checksum,
        storageBucket: this.minio.bucketName,
        storageKey,
      },
      status: ImportJobStatus.PENDING,
      correlationId,
      channel,
      providerId,
    });
  }
}
