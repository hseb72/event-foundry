import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Affectation d'un rôle plateforme à un utilisateur (administration). */
export class AssignRoleDto {
  @ApiProperty({ example: 'Organizer', description: 'Nom du rôle à affecter.' })
  @IsString()
  @MinLength(1)
  role!: string;
}
