import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SecretScope, SecretStatus } from '@prisma/client';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AiCallLogService } from '../ai/ai-call-log.service';
import { AiConfigService, PLATFORM_SCOPE_KEY } from '../ai/ai-config.service';
import { AiCallStatsDto } from '../ai/dto/ai-call-stats.dto';
import { AiConfigDto, UpdateAiConfigDto } from '../ai/dto/ai-config.dto';
import { MailConfigDto, UpdateMailConfigDto } from './dto/platform-config.dto';
import { TechnicalConfigDto, UpdateTechnicalConfigDto } from './dto/technical-config.dto';
import { PlatformConfigService } from './platform-config.service';
import { TechnicalConfigService } from './technical-config.service';

/**
 * Configuration plateforme (FSPEC.09 / TSPEC.09), écran Operator `OPE-005`. Réservée à
 * `pipeline.manage` (Platform Operator). Mail : SMTP + secret + test. IA plateforme : délègue au
 * service IA (portée PLATFORM), interrupteur global via `enabled`. Aucun secret n'est renvoyé.
 */
@ApiTags('platform-config')
@ApiBearerAuth()
@RequirePermissions('pipeline.manage')
@Controller('admin/config')
export class PlatformConfigController {
  constructor(
    private readonly config: PlatformConfigService,
    private readonly ai: AiConfigService,
    private readonly aiCallLog: AiCallLogService,
    private readonly technical: TechnicalConfigService,
  ) {}

  @Get('mail')
  @ApiOkResponse({ type: MailConfigDto })
  getMail(): Promise<MailConfigDto | null> {
    return this.config.getMail();
  }

  @Put('mail')
  @ApiOkResponse({ type: MailConfigDto })
  updateMail(@Body() dto: UpdateMailConfigDto): Promise<MailConfigDto> {
    return this.config.updateMail(dto);
  }

  @Post('mail/test')
  @HttpCode(HttpStatus.OK)
  testMail(): Promise<{ status: SecretStatus }> {
    return this.config.testMail();
  }

  @Get('ai')
  @ApiOkResponse({ type: AiConfigDto })
  getAi(): Promise<AiConfigDto | null> {
    return this.ai.get(SecretScope.PLATFORM, PLATFORM_SCOPE_KEY);
  }

  @Put('ai')
  @ApiOkResponse({ type: AiConfigDto })
  updateAi(@Body() dto: UpdateAiConfigDto): Promise<AiConfigDto> {
    return this.ai.update(SecretScope.PLATFORM, PLATFORM_SCOPE_KEY, dto);
  }

  @Post('ai/test')
  @HttpCode(HttpStatus.OK)
  testAi(): Promise<{ status: SecretStatus }> {
    return this.ai.test(SecretScope.PLATFORM, PLATFORM_SCOPE_KEY);
  }

  /** Supervision des appels IA (Observabilité) : volumes, taux d'échec, durée par fournisseur/cas. */
  @Get('ai/stats')
  @ApiOkResponse({ type: AiCallStatsDto })
  aiStats(): Promise<AiCallStatsDto> {
    return this.aiCallLog.stats();
  }

  /** Limites techniques (taille d'upload, plafond quotidien d'imports). */
  @Get('technical')
  @ApiOkResponse({ type: TechnicalConfigDto })
  getTechnical(): Promise<TechnicalConfigDto> {
    return this.technical.get();
  }

  @Put('technical')
  @ApiOkResponse({ type: TechnicalConfigDto })
  updateTechnical(@Body() dto: UpdateTechnicalConfigDto): Promise<TechnicalConfigDto> {
    return this.technical.update(dto);
  }
}
