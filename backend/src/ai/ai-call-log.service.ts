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
}
