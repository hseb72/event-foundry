import { ApiProperty } from '@nestjs/swagger';
import { RecommendationAction } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** Décision de l'utilisateur sur une recommandation (accepter / ignorer / refuser). */
export class RecommendationFeedbackDto {
  @ApiProperty({ enum: RecommendationAction })
  @IsEnum(RecommendationAction)
  action!: RecommendationAction;
}
