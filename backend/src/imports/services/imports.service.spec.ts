import { ConfigService } from '@nestjs/config';
import { MinioService } from '../../infra/minio/minio.service';
import { QueueService } from '../../infra/queue/queue.service';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
import { UnsupportedFileTypeException } from '../exceptions/unsupported-file-type.exception';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportsService } from './imports.service';

function fakeJob(overrides: Partial<ImportJobWithAttachment> = {}): ImportJobWithAttachment {
  return {
    id: 'job-1',
    attachmentId: 'att-1',
    status: 'OCR_DONE',
    ocrText: 'texte',
    correlationId: 'corr-1',
    startedAt: null,
    finishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    attachment: {
      id: 'att-1',
      type: 'TEXT',
      originalName: null,
      contentType: 'text/plain',
      sizeBytes: 5,
      checksum: 'abc',
      storageBucket: 'bucket',
      storageKey: 'attachments/x.txt',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  } as unknown as ImportJobWithAttachment;
}

describe('ImportsService', () => {
  let repository: jest.Mocked<Pick<ImportJobRepository, 'createWithAttachment' | 'list' | 'findByIdWithAttachment'>>;
  let minio: jest.Mocked<Pick<MinioService, 'putObject' | 'bucketName'>>;
  let queue: jest.Mocked<Pick<QueueService, 'enqueueImport' | 'enqueueClassification'>>;
  let service: ImportsService;

  beforeEach(() => {
    repository = {
      createWithAttachment: jest.fn().mockResolvedValue(fakeJob()),
      list: jest.fn(),
      findByIdWithAttachment: jest.fn(),
    };
    minio = { putObject: jest.fn().mockResolvedValue(undefined), bucketName: 'bucket' } as never;
    queue = {
      enqueueImport: jest.fn().mockResolvedValue(undefined),
      enqueueClassification: jest.fn().mockResolvedValue(undefined),
    };
    const config = { get: jest.fn().mockReturnValue('fra+eng') } as unknown as ConfigService;
    service = new ImportsService(
      repository as unknown as ImportJobRepository,
      minio as unknown as MinioService,
      queue as unknown as QueueService,
      config,
    );
  });

  it('rejette un fichier au format non supporté', async () => {
    const file = { mimetype: 'application/zip', buffer: Buffer.from(''), originalname: 'x.zip', size: 0 };
    await expect(service.importFile(file as Express.Multer.File)).rejects.toBeInstanceOf(
      UnsupportedFileTypeException,
    );
    expect(minio.putObject).not.toHaveBeenCalled();
  });

  it('publie sur OCR_QUEUE pour un import fichier valide', async () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('img'),
      originalname: 'affiche.png',
      size: 3,
    };
    await service.importFile(file as Express.Multer.File);
    expect(minio.putObject).toHaveBeenCalledTimes(1);
    expect(queue.enqueueImport).toHaveBeenCalledTimes(1);
    expect(queue.enqueueClassification).not.toHaveBeenCalled();
  });

  it('classe directement un import texte, sans OCR', async () => {
    await service.importText('Tournoi Magic samedi');
    expect(queue.enqueueClassification).toHaveBeenCalledTimes(1);
    expect(queue.enqueueImport).not.toHaveBeenCalled();
    const [[payload]] = queue.enqueueClassification.mock.calls;
    expect(payload.engine).toBe('text-passthrough');
    expect(payload.rawText).toBe('Tournoi Magic samedi');
  });
});
