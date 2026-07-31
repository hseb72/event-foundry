import { ApiProperty } from '@nestjs/swagger';

/** Entrée du journal des transitions de statut d'un Event (traçabilité — TSPEC.05). */
export class EventStatusEventDto {
  @ApiProperty({ nullable: true, enum: ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'] })
  fromStatus!: string | null;

  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'] })
  toStatus!: string;

  @ApiProperty({ nullable: true, description: "Auteur de la transition (userId), si connu." })
  actorId!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  occurredAt!: string;
}
