import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

/** Ajout d'un membre à une organisation avec un rôle d'organisation (administration). */
export class AddMemberDto {
  @ApiProperty({ description: "UUID de l'utilisateur à rattacher." })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'Organizer', description: "Rôle d'organisation à affecter." })
  @IsString()
  @MinLength(1)
  role!: string;
}
