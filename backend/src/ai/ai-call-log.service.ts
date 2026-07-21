import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Un appel IA à tracer (jamais de contenu ni de clé — RG-AI-04). */
export interface AiCallRecord {
  useCase: string;
  provider: string;
  model: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'FALLBACK';
  correlationId: string;
}

/** Statistiques d'appels IA (supervision Operator — Observabilité). Aucun contenu ni secret. */
export interface AiCallStats {
  total: number;
  failures: number;
  failureRate: number;
  byProvider: { provider: string; total: number; failures: number; avgDurationMs: number }[];
  byUseCase: { useCase: string; total: number; failures: number }[];
}

/**
 * Journalisation des appels IA (ADR.16 §Traçabilité). Best-effort : n'interrompt jamais l'appelant.
 * Ne conserve que des métadonnées (fournisseur, modèle, durée, statut), jamais de contenu.
 */
@Injectable()
export class AiCallLogService {
  private readonly logger = new Logger(AiCallLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(call: AiCallRecord): Promise<void> {
    try {
      await this.prisma.aiCallLog.create({ data: call });
    } catch (error) {
      this.logger.warn(`Journalisation d'appel IA ignorée : ${(error as Error).message}`);
    }
  }

  /** Agrège les appels IA par fournisseur et par cas d'usage (supervision Operator). */
  async stats(): Promise<AiCallStats> {
    const [total, failures, providerTotals, providerFailures, useCaseTotals, useCaseFailures] =
      await Promise.all([
        this.prisma.aiCallLog.count(),
        this.prisma.aiCallLog.count({ where: { status: 'FAILED' } }),
        this.prisma.aiCallLog.groupBy({
          by: ['provider'],
          _count: { _all: true },
          _avg: { durationMs: true },
        }),
        this.prisma.aiCallLog.groupBy({ by: ['provider'], where: { status: 'FAILED' }, _count: { _all: true } }),
        this.prisma.aiCallLog.groupBy({ by: ['useCase'], _count: { _all: true } }),
        this.prisma.aiCallLog.groupBy({ by: ['useCase'], where: { status: 'FAILED' }, _count: { _all: true } }),
      ]);

    const providerFailMap = new Map(providerFailures.map((f) => [f.provider, f._count._all]));
    const useCaseFailMap = new Map(useCaseFailures.map((f) => [f.useCase, f._count._all]));

    return {
      total,
      failures,
      failureRate: total > 0 ? failures / total : 0,
      byProvider: providerTotals
        .map((p) => ({
          provider: p.provider,
          total: p._count._all,
          failures: providerFailMap.get(p.provider) ?? 0,
          avgDurationMs: Math.round(p._avg.durationMs ?? 0),
        }))
        .sort((a, b) => b.total - a.total),
      byUseCase: useCaseTotals
        .map((u) => ({
          useCase: u.useCase,
          total: u._count._all,
          failures: useCaseFailMap.get(u.useCase) ?? 0,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }
}
