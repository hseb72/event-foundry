import { SecretScope } from '@prisma/client';
import { AiCallLogService } from '../../ai/ai-call-log.service';
import { AiConfigService } from '../../ai/ai-config.service';
import { MinioService } from '../../infra/minio/minio.service';
import { AiExtractionConnector } from '../connectors/ai-extraction.connector';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { AiExtractionImportService } from './ai-extraction-import.service';
import { PipelineRunnerService } from './pipeline-runner.service';

describe('AiExtractionImportService (canal IA → pipeline déterministe — ADR.16)', () => {
  let jobs: jest.Mocked<Pick<ImportJobRepository, 'createWithAttachment' | 'transition'>>;
  let pipeline: jest.Mocked<
    Pick<ImportPipelineRepository, 'createRawEvents' | 'findKnownProviderKeys' | 'persistResult'>
  >;
  let minio: jest.Mocked<Pick<MinioService, 'putObject' | 'bucketName'>>;
  let aiConfig: jest.Mocked<Pick<AiConfigService, 'resolveForUseCase'>>;
  let aiCallLog: jest.Mocked<Pick<AiCallLogService, 'record'>>;
  let connector: AiExtractionConnector;
  let service: AiExtractionImportService;

  const assistant = { scope: SecretScope.USER, provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk' };

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
            providerId: 'ai-extraction',
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
    aiConfig = { resolveForUseCase: jest.fn() };
    aiCallLog = { record: jest.fn().mockResolvedValue(undefined) };
    connector = { providerId: 'ai-extraction', version: '1.0.0', channel: 'TEXT', describe: jest.fn(), extract: jest.fn() } as unknown as AiExtractionConnector;

    const runner = new PipelineRunnerService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      new ValidateStage(),
      new NormalizeStage(),
      new DeduplicateStage(),
    );
    service = new AiExtractionImportService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      minio as unknown as MinioService,
      runner,
      aiConfig as unknown as AiConfigService,
      aiCallLog as unknown as AiCallLogService,
      [connector],
    );
  });

  it('refuse si aucune IA n’est configurée (repli explicite)', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(null);
    await expect(service.import('Annonce', { userId: 'u1', organizationId: null })).rejects.toThrow(
      /Aucune IA configurée/,
    );
    expect(jobs.createWithAttachment).not.toHaveBeenCalled();
  });

  it('extrait via l’IA, journalise l’appel (SUCCESS) et produit un candidate', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(assistant);
    (connector.extract as jest.Mock).mockResolvedValue([
      { providerKey: null, payload: { title: 'Tournoi', starts_at: '2026-08-01T18:00:00Z', activity: 'Magic' } },
    ]);

    await service.import('Annonce…', { userId: 'u1', organizationId: 'org1' });

    expect(aiConfig.resolveForUseCase).toHaveBeenCalledWith('u1', 'org1', 'DOC_UNDERSTANDING');
    expect(aiCallLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'SUCCESS', useCase: 'DOC_UNDERSTANDING', provider: 'openai' }),
    );
    expect(pipeline.persistResult.mock.calls[0][0].stats.createdCount).toBe(1);
  });

  it('journalise FAILED et met le job en échec si l’IA échoue', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue(assistant);
    (connector.extract as jest.Mock).mockRejectedValue(new Error('429'));

    await expect(service.import('Annonce…', { userId: 'u1', organizationId: null })).rejects.toThrow('429');
    expect(aiCallLog.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED' }));
    expect(jobs.transition).toHaveBeenCalledWith('job-1', 'FAILED', expect.any(String), expect.any(Object));
  });
});
