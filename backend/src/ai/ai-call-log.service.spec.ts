import { PrismaService } from '../infra/prisma/prisma.service';
import { AiCallLogService } from './ai-call-log.service';

describe('AiCallLogService (traçabilité IA — RG-AI-04)', () => {
  const record = {
    useCase: 'OCR',
    provider: 'openai',
    model: 'gpt-4o-mini',
    durationMs: 1200,
    status: 'SUCCESS' as const,
    correlationId: 'corr-1',
  };

  it('journalise un appel IA (métadonnées seulement)', async () => {
    const create = jest.fn().mockResolvedValue({});
    const service = new AiCallLogService({ aiCallLog: { create } } as unknown as PrismaService);
    await service.record(record);
    expect(create).toHaveBeenCalledWith({ data: record });
  });

  it('best-effort : une erreur de journalisation ne remonte pas', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db down'));
    const service = new AiCallLogService({ aiCallLog: { create } } as unknown as PrismaService);
    await expect(service.record(record)).resolves.toBeUndefined();
  });
});
