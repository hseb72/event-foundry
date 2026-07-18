import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/** Remplace l'ensemble des rôles d'un utilisateur (admin). Au moins un rôle requis. */
export class SetUserRolesDto {
  @ApiProperty({ type: [String], example: ['USER', 'ADMIN'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles!: string[];
}
