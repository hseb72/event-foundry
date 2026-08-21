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
import { HttpFetcherService } from './http-fetcher.service';
import { PipelineRunnerService } from './pipeline-runner.service';

/**
 * Canal **URL** du pipeline d'import (ADR.13 §Capture). Récupère une page (Fetch), en extrait les
 * événements balisés schema.org (Extract, déterministe — UrlConnector), conserve la page source dans
 * MinIO, puis exécute le pipeline commun. Aucune décision métier ; sortie en EventCandidates
 * (validation humaine — source à confiance faible, RG-IMP-06). La page source est conservée pour le
 * rejeu (RG-IMP-03).
 */
@Injectable()
export class UrlImportService {
  constructor(
    private readonly jobs: ImportJobRepository,
    private readonly pipeline: ImportPipelineRepository,
    private readonly minio: MinioService,
    private readonly fetcher: HttpFetcherService,
    private readonly runner: PipelineRunnerService,
    @Inject(IMPORT_CONNECTORS) private readonly connectors: ImportConnector[],
  ) {}

  async import(url: string, createdById?: string | null, organizationId?: string | null): Promise<ImportJobWithAttachment> {
    const target = url?.trim() ?? '';
    if (!target) {
      throw new BadRequestException('URL manquante.');
    }
    const connector = this.resolveUrlConnector();
    const correlationId = getCorrelationId() ?? generateCorrelationId();

    // Fetch (I/O) avant matérialisation du job : le job porte la page source acquise.
    const fetched = await this.fetcher.fetch(target);
    const job = await this.createJob(fetched.content, fetched.finalUrl, connector.providerId, correlationId, createdById ?? null, organizationId ?? null);

    try {
      await this.jobs.transition(job.id, ImportJobStatus.EXTRACTING, correlationId, {
        startedAt: new Date(),
      });
      const drafts = await connector.extract({
        content: fetched.content,
        contentType: fetched.contentType,
      });
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

      const stats = await this.runner.run({
        importJobId: job.id,
        providerId: connector.providerId,
        correlationId,
        rawEvents,
        objectsRead: drafts.length,
      });

      job.status = ImportJobStatus.READY_FOR_VALIDATION;
      job._count = { candidates: stats.createdCount };
      return job;
    } catch (error) {
      await this.jobs.transition(job.id, ImportJobStatus.FAILED, correlationId, {
        finishedAt: new Date(),
      });
      throw error;
    }
  }

  private resolveUrlConnector(): ImportConnector {
    const connector = this.connectors.find((c) => c.channel === ImportChannel.URL);
    if (!connector) {
      throw new BadRequestException('Aucun connecteur URL configuré.');
    }
    return connector;
  }

  private async createJob(
    html: string,
    sourceUrl: string,
    providerId: string,
    correlationId: string,
    createdById: string | null,
    organizationId: string | null = null,
  ): Promise<ImportJobWithAttachment> {
    const attachmentId = randomUUID();
    const buffer = Buffer.from(html, 'utf-8');
    const checksum = createHash('sha256').update(buffer).digest('hex');
    const storageKey = `attachments/${attachmentId}.html`;

    await this.minio.putObject(storageKey, buffer, 'text/html; charset=utf-8');

    return this.jobs.createWithAttachment({
      attachment: {
        id: attachmentId,
        type: 'TEXT',
        originalName: sourceUrl.slice(0, 255),
        contentType: 'text/html',
        sizeBytes: buffer.length,
        checksum,
        storageBucket: this.minio.bucketName,
        storageKey,
      },
      status: ImportJobStatus.PENDING,
      correlationId,
      channel: ImportChannel.URL,
      providerId,
      createdById,
      // Origine de la soumission (FSPEC.22) : sans elle, un import URL réalisé depuis l'expérience
      // Organizer aurait basculé dans l'inventaire personnel de son auteur.
      organizationId,
    });
  }
}
