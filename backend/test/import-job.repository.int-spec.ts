import { randomUUID } from 'node:crypto';
import { ImportJobStatus } from '@prisma/client';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { ImportJobRepository } from '../src/imports/repositories/import-job.repository';

/**
 * Test d'intégration du Repository sur une vraie base PostgreSQL (CLAUDE.md §12) : vérifie
 * que `transition` met à jour le statut et journalise chaque passage d'état atomiquement.
 */
describe('ImportJobRepository (intégration PostgreSQL)', () => {
  const prisma = new PrismaService();
  const repository = new ImportJobRepository(prisma);
  const createdJobIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.importJob.deleteMany({ where: { id: { in: createdJobIds } } });
    await prisma.$disconnect();
  });

  it('journalise chaque transition dans import_job_events', async () => {
    const job = await repository.createWithAttachment({
      attachment: {
        id: randomUUID(),
        type: 'TEXT',
        originalName: null,
        contentType: 'text/plain',
        sizeBytes: 3,
        checksum: randomUUID(),
        storageBucket: 'test',
        storageKey: `attachments/${randomUUID()}.txt`,
      },
      status: ImportJobStatus.PENDING,
      correlationId: 'int-corr',
    });
    createdJobIds.push(job.id);

    await repository.transition(job.id, ImportJobStatus.OCR_RUNNING, 'int-corr', {
      startedAt: new Date(),
    });
    await repository.transition(job.id, ImportJobStatus.OCR_DONE, 'int-corr', {
      ocrText: 'texte océrisé',
    });

    const detail = await repository.findDetailById(job.id);
    expect(detail?.status).toBe(ImportJobStatus.OCR_DONE);
    expect(detail?.ocrText).toBe('texte océrisé');

    // La création pose l'état initial, puis chaque transition ajoute une ligne, dans l'ordre.
    expect(detail?.events.map((e) => e.status)).toEqual([
      ImportJobStatus.PENDING,
      ImportJobStatus.OCR_RUNNING,
      ImportJobStatus.OCR_DONE,
    ]);
  });

  it('supprime le journal en cascade avec l’ImportJob', async () => {
    const job = await repository.createWithAttachment({
      attachment: {
        id: randomUUID(),
        type: 'TEXT',
        originalName: null,
        contentType: 'text/plain',
        sizeBytes: 3,
        checksum: randomUUID(),
        storageBucket: 'test',
        storageKey: `attachments/${randomUUID()}.txt`,
      },
      status: ImportJobStatus.PENDING,
      correlationId: 'int-corr',
    });

    await prisma.importJob.delete({ where: { id: job.id } });
    const remaining = await prisma.importJobEvent.count({ where: { importJobId: job.id } });
    expect(remaining).toBe(0);
  });
});
