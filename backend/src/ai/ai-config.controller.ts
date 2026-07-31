import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SecretScope, SecretStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AiConfigService } from './ai-config.service';
import { AiConfigDto, UpdateAiConfigDto } from './dto/ai-config.dto';

/**
 * Configuration IA personnelle (ADR.16 / TSPEC.07) : chaque utilisateur branche sa propre IA
 * (opt-in). Self-service — aucune permission spécifique (RBAC V2). La clé n'est jamais renvoyée.
 */
@ApiTags('ai')
@ApiBearerAuth()
@Controller('me/ai-config')
export class AiConfigController {
  constructor(private readonly service: AiConfigService) {}

  @Get()
  @ApiOkResponse({ type: AiConfigDto })
  get(@CurrentUser() user: AuthenticatedUser): Promise<AiConfigDto | null> {
    return this.service.get(SecretScope.USER, user.userId);
  }

  @Put()
  @ApiOkResponse({ type: AiConfigDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAiConfigDto,
  ): Promise<AiConfigDto> {
    return this.service.update(SecretScope.USER, user.userId, dto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test(@CurrentUser() user: AuthenticatedUser): Promise<{ status: SecretStatus }> {
    return this.service.test(SecretScope.USER, user.userId);
  }
}
