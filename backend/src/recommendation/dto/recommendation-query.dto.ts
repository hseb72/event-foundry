import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Paramètres d'obtention des recommandations (EPIC 06). */
export class RecommendationQueryDto {
  @ApiPropertyOptional({
    description: 'Mode « Surprends-moi » : réduit le poids des habitudes, favorise la découverte.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  surprise?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}
