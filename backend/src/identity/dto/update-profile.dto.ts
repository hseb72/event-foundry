import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Mise à jour du profil de l'utilisateur courant. Tous les champs sont optionnels. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ type: Object, description: 'Préférences libres (thème, langue…).' })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
