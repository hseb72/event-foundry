import { ConfigService } from '@nestjs/config';
import { AiConfigService } from '../../ai/ai-config.service';
import { MinioService } from '../../infra/minio/minio.service';
import { QueueService } from '../../infra/queue/queue.service';
import { TechnicalConfigService } from '../../platform-config/technical-config.service';
import { DEFAULT_MAX_UPLOAD_BYTES } from '../imports.constants';
import type { ImportJobWithAttachment } from '../entities/import-job.entity';
import { FileTooLargeException } from '../exceptions/file-too-large.exception';
import { ImportQuotaExceededException } from '../exceptions/import-quota-exceeded.exception';
import { UnsupportedFileTypeException } from '../exceptions/unsupported-file-type.exception';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportsService } from './imports.service';

function fakeJob(overrides: Partial<ImportJobWithAttachment> = {}): ImportJobWithAttachment {
  return {
    id: 'job-1',
    attachmentId: 'att-1',
    status: 'PENDING',
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
  let repository: jest.Mocked<
    Pick<
      ImportJobRepository,
      'createWithAttachment' | 'list' | 'findByIdWithAttachment' | 'transition' | 'countSince'
    >
  >;
  let minio: jest.Mocked<Pick<MinioService, 'putObject' | 'bucketName'>>;
  let queue: jest.Mocked<Pick<QueueService, 'enqueueImport' | 'enqueueClassification'>>;
  let aiConfig: jest.Mocked<Pick<AiConfigService, 'resolveForUseCase'>>;
  let technical: jest.Mocked<Pick<TechnicalConfigService, 'getLimits'>>;
  let service: ImportsService;

  beforeEach(() => {
    repository = {
      createWithAttachment: jest.fn().mockResolvedValue(fakeJob()),
      list: jest.fn(),
      findByIdWithAttachment: jest.fn(),
      transition: jest.fn().mockResolvedValue(fakeJob()),
      countSince: jest.fn().mockResolvedValue(0),
    };
    minio = { putObject: jest.fn().mockResolvedValue(undefined), bucketName: 'bucket' } as never;
    queue = {
      enqueueImport: jest.fn().mockResolvedValue(undefined),
      enqueueClassification: jest.fn().mockResolvedValue(undefined),
    };
    const config = { get: jest.fn().mockReturnValue('fra+eng') } as unknown as ConfigService;
    aiConfig = { resolveForUseCase: jest.fn().mockResolvedValue(null) };
    technical = {
      getLimits: jest.fn().mockResolvedValue({ maxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES, maxImportsPerDay: 0 }),
    };
    service = new ImportsService(
      repository as unknown as ImportJobRepository,
      minio as unknown as MinioService,
      queue as unknown as QueueService,
      config,
      aiConfig as unknown as AiConfigService,
      technical as unknown as TechnicalConfigService,
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
    // Sans IA configurée : pas d'assistant dans le job (OCR interne).
    expect(queue.enqueueImport.mock.calls[0][0].ocrAssistant).toBeUndefined();
    // Le Backend historise l'entrée dans l'étape OCR.
    expect(repository.transition).toHaveBeenCalledWith(
      'job-1',
      'OCR_RUNNING',
      expect.any(String),
      expect.objectContaining({ startedAt: expect.any(Date) }),
    );
  });

  it('joint l’assistant IA au job quand une IA « OCR » est configurée', async () => {
    aiConfig.resolveForUseCase.mockResolvedValue({
      scope: 'USER' as never,
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-secret',
    });
    const file = { mimetype: 'image/png', buffer: Buffer.from('img'), originalname: 'a.png', size: 3 };

    await service.importFile(file as Express.Multer.File, { userId: 'u-1', organizationId: 'org-1' });

    expect(aiConfig.resolveForUseCase).toHaveBeenCalledWith('u-1', 'org-1', 'OCR');
    expect(queue.enqueueImport.mock.calls[0][0].ocrAssistant).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-secret',
    });
  });

  it('rejette un fichier au-delà de la taille maximale configurée', async () => {
    technical.getLimits.mockResolvedValue({ maxUploadBytes: 1024, maxImportsPerDay: 0 });
    const file = { mimetype: 'image/png', buffer: Buffer.from('img'), originalname: 'a.png', size: 4096 };
    await expect(service.importFile(file as Express.Multer.File)).rejects.toBeInstanceOf(
      FileTooLargeException,
    );
    expect(minio.putObject).not.toHaveBeenCalled();
  });

  it('rejette un import quand le plafond quotidien est atteint', async () => {
    technical.getLimits.mockResolvedValue({ maxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES, maxImportsPerDay: 5 });
    repository.countSince.mockResolvedValue(5);
    const file = { mimetype: 'image/png', buffer: Buffer.from('img'), originalname: 'a.png', size: 3 };
    await expect(service.importFile(file as Express.Multer.File)).rejects.toBeInstanceOf(
      ImportQuotaExceededException,
    );
    await expect(service.importText('Tournoi')).rejects.toBeInstanceOf(ImportQuotaExceededException);
    expect(queue.enqueueImport).not.toHaveBeenCalled();
  });

  it('classe directement un import texte, sans OCR', async () => {
    await service.importText('Tournoi Magic samedi');
    expect(queue.enqueueClassification).toHaveBeenCalledTimes(1);
    expect(queue.enqueueImport).not.toHaveBeenCalled();
    const [[payload]] = queue.enqueueClassification.mock.calls;
    expect(payload.engine).toBe('text-passthrough');
    expect(payload.rawText).toBe('Tournoi Magic samedi');
    // Import texte : pas d'OCR, transition directe vers la classification.
    expect(repository.transition).toHaveBeenCalledWith(
      'job-1',
      'CLASSIFICATION_RUNNING',
      expect.any(String),
      expect.objectContaining({ startedAt: expect.any(Date) }),
    );
  });
});
