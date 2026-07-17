import type { Organizer } from '@prisma/client';
import { OrganizerResponseDto } from './organizer.dto';

export class OrganizerMapper {
  static toResponse(organizer: Organizer): OrganizerResponseDto {
    return {
      id: organizer.id,
      name: organizer.name,
      website: organizer.website,
      isActive: organizer.isActive,
      createdAt: organizer.createdAt.toISOString(),
    };
  }
}
