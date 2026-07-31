import type { RawEvent } from '@event-foundry/contracts';
import { ImportJobNotFoundException } from '../exceptions/import-job-not-found.exception';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { ImportReplayService } from './import-replay.service';
import { PipelineRunnerService } from './pipeline-runner.service';
import { TechnicalConfigService } from '../../platform-config/technical-config.service';
import { ReferentialProvisioningService } from './referential-provisioning.service';
import type { EventBus } from '../../platform/event-bus/event-bus';

describe('ImportReplayService (rejeu — RG-IMP-03)', () => {
  let jobs: jest.Mocked<Pick<ImportJobRepository, 'findByIdWithAttachment' | 'transition'>>;
  let pipeline: jest.Mocked<
    Pick<ImportPipelineRepository, 'findRawEventsByJob' | 'findKnownProviderKeys' | 'persistResult'>
  >;
  let service: ImportReplayService;

  const raw: RawEvent = {
    id: 're-1',
    importJobId: 'job-1',
    providerId: 'structured-file',
    providerKey: 'k1',
    connectorVersion: '1.0.0',
    acquiredAt: '2026-07-21T00:00:00Z',
    payload: { title: 'Tournoi', starts_at: '2026-08-01T18:00:00Z' },
    mediaRefs: [],
    correlationId: 'corr-1',
  };

  beforeEach(() => {
    jobs = {
      findByIdWithAttachment: jest.fn().mockResolvedValue({ id: 'job-1', providerId: 'structured-file' }),
      transition: jest.fn().mockResolvedValue(undefined),
    };
    pipeline = {
      findRawEventsByJob: jest.fn().mockResolvedValue([raw]),
      findKnownProviderKeys: jest.fn().mockResolvedValue(new Set<string>()),
      persistResult: jest.fn().mockResolvedValue(undefined),
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
    service = new ImportReplayService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      runner,
    );
  });

  it('rejoue Validate→Persist depuis les Raw Events, en remplaçant les candidates en attente', async () => {
    const result = await service.replay('job-1');
    expect(result).toEqual({ importJobId: 'job-1', rawEventCount: 1 });
    expect(pipeline.persistResult).toHaveBeenCalledWith(
      expect.objectContaining({ replaceExisting: true }),
    );
    expect(pipeline.persistResult.mock.calls[0][0].candidates).toHaveLength(1);
  });

  it('échoue si l’import est introuvable', async () => {
    jobs.findByIdWithAttachment.mockResolvedValue(null);
    await expect(service.replay('absent')).rejects.toBeInstanceOf(ImportJobNotFoundException);
  });

  it('refuse le rejeu sans Raw Event conservé (canal OCR V2)', async () => {
    pipeline.findRawEventsByJob.mockResolvedValue([]);
    await expect(service.replay('job-1')).rejects.toThrow(/rejeu impossible/);
  });
});
