import type { Venue } from '@prisma/client';
import { VenueResponseDto } from './venue.dto';

export class VenueMapper {
  static toResponse(venue: Venue): VenueResponseDto {
    return {
      id: venue.id,
      name: venue.name,
      organizerId: venue.organizerId,
      address: venue.address,
      postalCode: venue.postalCode,
      city: venue.city,
      latitude: venue.latitude,
      longitude: venue.longitude,
      isActive: venue.isActive,
      createdAt: venue.createdAt.toISOString(),
    };
  }
}
