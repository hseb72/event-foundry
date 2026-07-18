import { ImportStatsRepository } from '../repositories/import-stats.repository';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let repository: jest.Mocked<
    Pick<
      ImportStatsRepository,
      | 'importJobsByStatus'
      | 'transitionsByStatus'
      | 'candidatesByStatus'
      | 'eventsBySource'
      | 'avgOcrProcessingMs'
      | 'completedDurations'
    >
  >;
  let service: StatsService;

  beforeEach(() => {
    repository = {
      importJobsByStatus: jest.fn().mockResolvedValue([{ status: 'READY_FOR_VALIDATION', count: 2 }]),
      transitionsByStatus: jest.fn().mockResolvedValue([
        { status: 'PENDING', count: 3 },
        { status: 'OCR_RUNNING', count: 1 },
      ]),
      candidatesByStatus: jest.fn().mockResolvedValue([{ status: 'PENDING', count: 2 }]),
      eventsBySource: jest.fn().mockResolvedValue([{ status: 'MANUAL', count: 4 }]),
      avgOcrProcessingMs: jest.fn().mockResolvedValue(123.7),
      completedDurations: jest.fn().mockResolvedValue([
        { startedAt: new Date('2026-01-01T00:00:00Z'), finishedAt: new Date('2026-01-01T00:00:10Z') },
        { startedAt: new Date('2026-01-01T00:00:00Z'), finishedAt: new Date('2026-01-01T00:00:20Z') },
      ]),
    };
    service = new StatsService(repository as unknown as ImportStatsRepository);
  });

  it('complète les états manquants à 0 et calcule les totaux', async () => {
    const stats = await service.importStats();

    expect(stats.totalImports).toBe(2);
    // Tous les états de l'enum sont présents, les absents à 0.
    expect(stats.importsByStatus['PENDING']).toBe(0);
    expect(stats.importsByStatus['READY_FOR_VALIDATION']).toBe(2);
    expect(Object.keys(stats.importsByStatus)).toHaveLength(7);
  });

  it('moyenne les durées OCR et totales', async () => {
    const stats = await service.importStats();

    expect(stats.durations.avgOcrProcessingMs).toBe(124); // arrondi
    expect(stats.durations.avgTotalMs).toBe(15000); // (10s + 20s) / 2
    expect(stats.durations.sampleCount).toBe(2);
  });

  it('agrège candidates et events', async () => {
    const stats = await service.importStats();

    expect(stats.totalCandidates).toBe(2);
    expect(stats.candidatesByStatus['REJECTED']).toBe(0);
    expect(stats.totalEvents).toBe(4);
    expect(stats.eventsBySource['MANUAL']).toBe(4);
    expect(stats.eventsBySource['IMPORT']).toBe(0);
  });
});
