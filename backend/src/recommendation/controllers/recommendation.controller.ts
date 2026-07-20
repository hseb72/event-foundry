import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { RecommendationFeedbackDto } from '../dto/recommendation-feedback.dto';
import { RecommendationQueryDto } from '../dto/recommendation-query.dto';
import { RecommendationDto } from '../dto/recommendation-response.dto';
import { RecommendationService } from '../services/recommendation.service';

/**
 * Recommandations personnelles (EPIC 06). Toujours calculées dans le contexte de l'identité
 * courante (aucune recommandation d'un autre utilisateur n'est accessible). Réservé à
 * `recommendation.view` (rôle Explorer).
 */
@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('me/recommendations')
export class RecommendationController {
  constructor(private readonly recommendations: RecommendationService) {}

  @Get()
  @RequirePermissions('recommendation.view')
  @ApiOkResponse({ type: [RecommendationDto] })
  recommend(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecommendationQueryDto,
  ): Promise<RecommendationDto[]> {
    return this.recommendations.recommend(user.userId, {
      surprise: query.surprise ?? false,
      take: query.take ?? 10,
    });
  }

  /** Décision de l'utilisateur : accepter / ignorer / refuser (les refus affinent les propositions). */
  @Post(':eventId/feedback')
  @RequirePermissions('recommendation.view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async feedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: RecommendationFeedbackDto,
  ): Promise<void> {
    await this.recommendations.feedback(user.userId, eventId, dto.action);
  }
}
