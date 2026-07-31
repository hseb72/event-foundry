import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from './event-response.dto';

export class PaginatedEventsResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  items!: EventResponseDto[];

  @ApiProperty({ description: 'Nombre total de résultats (hors pagination).' })
  total!: number;

  @ApiProperty()
  skip!: number;

  @ApiProperty()
  take!: number;
}
