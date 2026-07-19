import { ApiProperty } from '@nestjs/swagger';

/** Média (image) d'un Event, avec une URL de lecture temporaire (présignée MinIO). */
export class EventMediaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'URL de lecture temporaire (présignée).' })
  url!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  position!: number;
}
