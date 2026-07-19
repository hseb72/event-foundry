import { ApiProperty } from '@nestjs/swagger';
import { Experience } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** Change l'expérience active (contexte d'interface). Ne modifie jamais les permissions (ADR.11). */
export class ChangeExperienceDto {
  @ApiProperty({ enum: Experience })
  @IsEnum(Experience)
  experience!: Experience;
}
