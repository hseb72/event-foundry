import { ApiProperty } from '@nestjs/swagger';
import { FollowTargetType } from '@prisma/client';
import { IsBoolean, IsEnum, IsUUID } from 'class-validator';

/** Suivre un objet (Follow Domain — ADR.19 / FSPEC.06). */
export class CreateFollowDto {
  @ApiProperty({ enum: FollowTargetType })
  @IsEnum(FollowTargetType)
  targetType!: FollowTargetType;

  @ApiProperty({ description: "UUID de l'objet suivi (organisateur, lieu, activité, catégorie…)." })
  @IsUUID()
  targetId!: string;
}

/** Activer / couper les notifications d'un suivi (RG-FOL-04). */
export class UpdateFollowDto {
  @ApiProperty({ description: 'Notifications activées pour ce suivi.' })
  @IsBoolean()
  notify!: boolean;
}

/** Vue d'un suivi. */
export class FollowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: FollowTargetType })
  targetType!: FollowTargetType;

  @ApiProperty()
  targetId!: string;

  @ApiProperty({ description: 'Notifications activées pour ce suivi.' })
  notify!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
