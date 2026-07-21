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

  it('agrège les appels par fournisseur et cas d’usage (supervision Operator)', async () => {
    const count = jest
      .fn()
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3); // failures (status=FAILED)
    const groupBy = jest
      .fn()
      .mockResolvedValueOnce([
        { provider: 'openai', _count: { _all: 7 }, _avg: { durationMs: 1200.6 } },
        { provider: 'anthropic', _count: { _all: 3 }, _avg: { durationMs: 800 } },
      ]) // provider totals
      .mockResolvedValueOnce([{ provider: 'openai', _count: { _all: 2 } }]) // provider failures
      .mockResolvedValueOnce([
        { useCase: 'OCR', _count: { _all: 6 } },
        { useCase: 'TRANSLATE', _count: { _all: 4 } },
      ]) // useCase totals
      .mockResolvedValueOnce([{ useCase: 'TRANSLATE', _count: { _all: 3 } }]); // useCase failures
    const service = new AiCallLogService({ aiCallLog: { count, groupBy } } as unknown as PrismaService);

    const stats = await service.stats();

    expect(stats.total).toBe(10);
    expect(stats.failures).toBe(3);
    expect(stats.failureRate).toBeCloseTo(0.3);
    expect(stats.byProvider[0]).toEqual({
      provider: 'openai',
      total: 7,
      failures: 2,
      avgDurationMs: 1201,
    });
    expect(stats.byProvider[1]).toEqual({
      provider: 'anthropic',
      total: 3,
      failures: 0,
      avgDurationMs: 800,
    });
    expect(stats.byUseCase.find((u) => u.useCase === 'TRANSLATE')).toEqual({
      useCase: 'TRANSLATE',
      total: 4,
      failures: 3,
    });
  });

  it('taux d’échec = 0 quand aucun appel', async () => {
    const count = jest.fn().mockResolvedValue(0);
    const groupBy = jest.fn().mockResolvedValue([]);
    const service = new AiCallLogService({ aiCallLog: { count, groupBy } } as unknown as PrismaService);
    const stats = await service.stats();
    expect(stats).toEqual({ total: 0, failures: 0, failureRate: 0, byProvider: [], byUseCase: [] });
  });
});
