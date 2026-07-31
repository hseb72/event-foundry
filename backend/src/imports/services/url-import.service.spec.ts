import { ImportChannel, ImportJobStatus } from '@prisma/client';
import { MinioService } from '../../infra/minio/minio.service';
import { UrlConnector } from '../connectors/url.connector';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { HttpFetcherService } from './http-fetcher.service';
import { PipelineRunnerService } from './pipeline-runner.service';
import { TechnicalConfigService } from '../../platform-config/technical-config.service';
import { ReferentialProvisioningService } from './referential-provisioning.service';
import type { EventBus } from '../../platform/event-bus/event-bus';
import { UrlImportService } from './url-import.service';

describe('UrlImportService (capture URL — ADR.13)', () => {
  let jobs: jest.Mocked<Pick<ImportJobRepository, 'createWithAttachment' | 'transition'>>;
  let pipeline: jest.Mocked<
    Pick<ImportPipelineRepository, 'createRawEvents' | 'findKnownProviderKeys' | 'persistResult'>
  >;
  let minio: jest.Mocked<Pick<MinioService, 'putObject' | 'bucketName'>>;
  let fetcher: jest.Mocked<Pick<HttpFetcherService, 'fetch'>>;
  let service: UrlImportService;

  const html = `<script type="application/ld+json">${JSON.stringify({
    '@type': 'Event',
    name: 'Expo',
    startDate: '2026-08-01T18:00:00Z',
    url: 'https://ex.org/e/1',
  })}</script>`;

  beforeEach(() => {
    jobs = {
      createWithAttachment: jest.fn().mockResolvedValue({ id: 'job-1', status: 'PENDING' }),
      transition: jest.fn().mockResolvedValue(undefined),
    };
    pipeline = {
      createRawEvents: jest.fn().mockImplementation((_j, corr, drafts) =>
        Promise.resolve(
          drafts.map((d: { payload: Record<string, unknown>; providerKey: string | null }, i: number) => ({
            id: `re-${i}`,
            importJobId: 'job-1',
            providerId: 'web-url',
            providerKey: d.providerKey,
            connectorVersion: '1.0.0',
            acquiredAt: '2026-07-21T00:00:00Z',
            payload: d.payload,
            mediaRefs: [],
            correlationId: corr,
          })),
        ),
      ),
      findKnownProviderKeys: jest.fn().mockResolvedValue(new Set<string>()),
      persistResult: jest.fn().mockResolvedValue(undefined),
    };
    minio = { putObject: jest.fn().mockResolvedValue(undefined), bucketName: 'bucket' } as never;
    fetcher = {
      fetch: jest.fn().mockResolvedValue({ content: html, contentType: 'text/html', finalUrl: 'https://ex.org' }),
    };
    const runner = new PipelineRunnerService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      new ValidateStage(),
      new NormalizeStage(),
      new DeduplicateStage(),
      { getProvisioning: jest.fn().mockResolvedValue({ autoProvisionReferentials: false, provisioningDefaultDomainId: null }) } as unknown as TechnicalConfigService,
      { provision: jest.fn().mockResolvedValue(undefined) } as unknown as ReferentialProvisioningService,
      { publish: jest.fn(), subscribe: jest.fn() } as unknown as EventBus,
    );
    service = new UrlImportService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      minio as unknown as MinioService,
      fetcher as unknown as HttpFetcherService,
      runner,
      [new UrlConnector()],
    );
  });

  it('capture la page, conserve la source et produit un candidate', async () => {
    await service.import('https://ex.org');

    expect(fetcher.fetch).toHaveBeenCalledWith('https://ex.org');
    expect(minio.putObject).toHaveBeenCalledTimes(1);
    expect(jobs.createWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ channel: ImportChannel.URL, providerId: 'web-url' }),
    );
    const persistArg = pipeline.persistResult.mock.calls[0][0];
    expect(persistArg.stats.createdCount).toBe(1);
    expect(persistArg.finalStatus).toBe(ImportJobStatus.READY_FOR_VALIDATION);
  });

  it('rejette une URL vide sans appeler le réseau', async () => {
    await expect(service.import('  ')).rejects.toThrow(/URL manquante/);
    expect(fetcher.fetch).not.toHaveBeenCalled();
  });
});
