import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
import type { DatePeriod } from '../date-range.util';

const PERIODS: DatePeriod[] = ['today', 'this-week', 'this-month', 'next-7-days', 'next-30-days'];

/** Fenêtre temporelle du calendrier (FSPEC.05). Par défaut : tous les événements. */
export class CalendarQueryDto {
  @ApiPropertyOptional({ enum: PERIODS })
  @IsOptional()
  @IsIn(PERIODS)
  period?: DatePeriod;

  @ApiPropertyOptional({ description: 'ISO 8601.' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO 8601.' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
