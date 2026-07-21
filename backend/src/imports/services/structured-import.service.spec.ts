import { ImportChannel, ImportJobStatus } from '@prisma/client';
import { MinioService } from '../../infra/minio/minio.service';
import { CsvJsonConnector } from '../connectors/csv-json.connector';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { StructuredImportService } from './structured-import.service';

describe('StructuredImportService (pipeline déterministe CSV/JSON — ADR.14)', () => {
  let jobs: jest.Mocked<Pick<ImportJobRepository, 'createWithAttachment' | 'transition'>>;
  let pipeline: jest.Mocked<
    Pick<ImportPipelineRepository, 'createRawEvents' | 'findKnownProviderKeys' | 'persistResult'>
  >;
  let minio: jest.Mocked<Pick<MinioService, 'putObject' | 'bucketName'>>;
  let service: StructuredImportService;

  beforeEach(() => {
    jobs = {
      createWithAttachment: jest.fn().mockResolvedValue({ id: 'job-1', status: 'PENDING' }),
      transition: jest.fn().mockResolvedValue(undefined),
    };
    pipeline = {
      // Renvoie des Raw Events avec un id, en écho des ébauches reçues.
      createRawEvents: jest.fn().mockImplementation((_jobId, corr, drafts) =>
        Promise.resolve(
          drafts.map((d: { payload: Record<string, unknown>; providerKey: string | null }, i: number) => ({
            id: `re-${i}`,
            importJobId: 'job-1',
            providerId: 'structured-file',
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
    service = new StructuredImportService(
      jobs as unknown as ImportJobRepository,
      pipeline as unknown as ImportPipelineRepository,
      minio as unknown as MinioService,
      new ValidateStage(),
      new NormalizeStage(),
      new DeduplicateStage(),
      [new CsvJsonConnector()],
    );
  });

  it('exécute le pipeline complet et produit des candidates avec volumétrie', async () => {
    const csv = [
      'key,title,starts_at',
      'k1,Tournoi A,2026-08-01T18:00:00Z',
      'k1,Doublon clé,2026-08-03T18:00:00Z',
      'k3,Sans date,',
    ].join('\n');

    await service.import(csv, 'text/csv');

    expect(minio.putObject).toHaveBeenCalledTimes(1);
    expect(jobs.createWithAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ channel: ImportChannel.CSV, providerId: 'structured-file' }),
    );
    // 3 objets lus, 3 raw events, 1 rejeté (sans date), 1 doublon (clé k1), 1 créé.
    const persistArg = pipeline.persistResult.mock.calls[0][0];
    expect(persistArg.stats).toEqual({
      objectsRead: 3,
      rawEventCount: 3,
      createdCount: 1,
      updatedCount: 0,
      duplicateCount: 1,
      rejectedCount: 1,
    });
    expect(persistArg.candidates).toHaveLength(1);
    expect(persistArg.finalStatus).toBe(ImportJobStatus.READY_FOR_VALIDATION);
  });

  it('détecte le canal JSON et historise l’échec si le contenu est illisible', async () => {
    await expect(service.import('[{cassé', 'application/json')).rejects.toThrow();
    expect(jobs.transition).toHaveBeenCalledWith(
      'job-1',
      ImportJobStatus.FAILED,
      expect.any(String),
      expect.objectContaining({ finishedAt: expect.any(Date) }),
    );
  });

  it('rejette un contenu vide sans créer de job', async () => {
    await expect(service.import('   ')).rejects.toThrow(/vide/);
    expect(jobs.createWithAttachment).not.toHaveBeenCalled();
  });
});
