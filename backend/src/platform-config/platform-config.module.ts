import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PlatformConfigController } from './platform-config.controller';
import { PlatformConfigRepository } from './platform-config.repository';
import { PlatformConfigService } from './platform-config.service';
import { TechnicalConfigService } from './technical-config.service';

/**
 * Configuration plateforme Operator (FSPEC.09 / TSPEC.09) : mail (SMTP), IA plateforme et limites
 * techniques. S'appuie sur SecretsModule (global) et AiModule (config IA par portée). Écran `OPE-005`.
 * Exporte `TechnicalConfigService` pour l'enforcement des limites d'import (module Imports).
 */
@Module({
  imports: [AiModule],
  controllers: [PlatformConfigController],
  providers: [PlatformConfigService, PlatformConfigRepository, TechnicalConfigService],
  exports: [TechnicalConfigService],
})
export class PlatformConfigModule {}
