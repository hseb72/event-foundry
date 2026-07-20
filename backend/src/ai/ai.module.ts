import { Module } from '@nestjs/common';
import { AiConfigController } from './ai-config.controller';
import { AiConfigRepository } from './ai-config.repository';
import { AiConfigService } from './ai-config.service';

/**
 * Domaine IA (ADR.16 / TSPEC.07) : configuration de l'assistance IA par portée, opt-in, cas
 * d'usage, clé stockée comme secret (SecretsModule global). Exporte `AiConfigService` pour les
 * consommateurs (pipeline d'import, configuration Operator).
 */
@Module({
  controllers: [AiConfigController],
  providers: [AiConfigService, AiConfigRepository],
  exports: [AiConfigService],
})
export class AiModule {}
