import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AssistantService } from './assistant.service';
import { AssistRequestDto, AssistResponseDto } from './dto/assist.dto';

/**
 * Assistance IA « texte » à la demande (ADR.16) : traduction / résumé / reformulation. Self-service,
 * utilise l'IA configurée par l'utilisateur (ou son organisation active). L'IA n'assiste que
 * l'affichage — le résultat n'est jamais persisté comme champ métier (règle d'or n°1).
 */
@ApiTags('ai')
@ApiBearerAuth()
@Controller('me/ai')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('assist')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AssistResponseDto })
  assist(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssistRequestDto,
  ): Promise<AssistResponseDto> {
    return this.assistant.assist(
      user.userId,
      user.activeOrganizationId,
      dto.useCase,
      dto.text,
      dto.targetLanguage,
    );
  }
}
