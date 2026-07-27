import type { EventFormat } from '@prisma/client';
import { EventFormatResponseDto } from './event-format.dto';

export class EventFormatMapper {
  static toResponse(eventFormat: EventFormat): EventFormatResponseDto {
    return {
      id: eventFormat.id,
      name: eventFormat.name,
      isActive: eventFormat.isActive,
      createdAt: eventFormat.createdAt.toISOString(),
    };
  }
}
