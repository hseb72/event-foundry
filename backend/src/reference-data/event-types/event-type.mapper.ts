import type { EventType } from '@prisma/client';
import { EventTypeResponseDto } from './event-type.dto';

export class EventTypeMapper {
  static toResponse(eventType: EventType): EventTypeResponseDto {
    return {
      id: eventType.id,
      name: eventType.name,
      isActive: eventType.isActive,
      createdAt: eventType.createdAt.toISOString(),
    };
  }
}
