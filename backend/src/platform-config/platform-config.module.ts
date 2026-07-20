import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PlatformConfigController } from './platform-config.controller';
import { PlatformConfigRepository } from './platform-config.repository';
import { PlatformConfigService } from './platform-config.service';

/**
 * Configuration plateforme Operator (FSPEC.09 / TSPEC.09) : mail (SMTP) et IA plateforme. S'appuie
 * sur SecretsModule (global) et AiModule (config IA par portée). Écran `OPE-005`.
 */
@Module({
  imports: [AiModule],
  controllers: [PlatformConfigController],
  providers: [PlatformConfigService, PlatformConfigRepository],
})
export class PlatformConfigModule {}
