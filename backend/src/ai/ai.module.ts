import { Module } from '@nestjs/common';
import { AiCallLogService } from './ai-call-log.service';
import { AiCatalogController } from './ai-catalog.controller';
import { AiConfigController } from './ai-config.controller';
import { AiConfigRepository } from './ai-config.repository';
import { AiConfigService } from './ai-config.service';
import { AiProviderVerifier } from './ai-provider-verifier';

/**
 * Domaine IA (ADR.16 / TSPEC.07) : configuration de l'assistance IA par portée, opt-in, cas
 * d'usage, clé stockée comme secret (SecretsModule global). Exporte `AiConfigService` pour les
 * consommateurs (pipeline d'import, configuration Operator).
 */
@Module({
  controllers: [AiConfigController, AiCatalogController],
  providers: [AiConfigService, AiConfigRepository, AiCallLogService, AiProviderVerifier],
  exports: [AiConfigService, AiCallLogService],
})
export class AiModule {}
