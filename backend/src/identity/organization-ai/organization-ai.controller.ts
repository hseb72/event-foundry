import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SecretStatus } from '@prisma/client';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { AiConfigDto, UpdateAiConfigDto } from '../../ai/dto/ai-config.dto';
import { OrganizationAiService } from './organization-ai.service';

/**
 * Configuration IA d'une organisation (ADR.16 / TSPEC.07), gérée par l'organizer
 * (`organization.manage` + isolation membre). La clé n'est jamais renvoyée.
 */
@ApiTags('organization-ai')
@ApiBearerAuth()
@RequirePermissions('organization.manage')
@Controller('identity/organizations/:organizationId/ai-config')
export class OrganizationAiController {
  constructor(private readonly service: OrganizationAiService) {}

  @Get()
  @ApiOkResponse({ type: AiConfigDto })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<AiConfigDto | null> {
    return this.service.get(user.userId, organizationId);
  }

  @Put()
  @ApiOkResponse({ type: AiConfigDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateAiConfigDto,
  ): Promise<AiConfigDto> {
    return this.service.update(user.userId, organizationId, dto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<{ status: SecretStatus }> {
    return this.service.test(user.userId, organizationId);
  }
}
