import { Injectable } from '@nestjs/common';
import type { Venue } from '@prisma/client';
import { OrganizerNotFoundException, VenueNotFoundException } from '../common/exceptions';
import { OrganizerRepository } from '../organizers/organizer.repository';
import { CreateVenueDto, UpdateVenueDto } from './venue.dto';
import { VenueRepository } from './venue.repository';

@Injectable()
export class VenuesService {
  constructor(
    private readonly repository: VenueRepository,
    private readonly organizerRepository: OrganizerRepository,
  ) {}

  list(includeInactive: boolean): Promise<Venue[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Venue> {
    const venue = await this.repository.findById(id);
    if (!venue) {
      throw new VenueNotFoundException(id);
    }
    return venue;
  }

  async create(dto: CreateVenueDto): Promise<Venue> {
    await this.assertOrganizerExists(dto.organizerId);
    return this.repository.create({
      name: dto.name,
      organizerId: dto.organizerId ?? null,
      address: dto.address ?? null,
      postalCode: dto.postalCode ?? null,
      city: dto.city ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
    });
  }

  async update(id: string, dto: UpdateVenueDto): Promise<Venue> {
    await this.getOrThrow(id);
    await this.assertOrganizerExists(dto.organizerId);
    return this.repository.update(id, dto);
  }

  async deactivate(id: string): Promise<Venue> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }

  private async assertOrganizerExists(organizerId?: string): Promise<void> {
    if (!organizerId) {
      return;
    }
    const organizer = await this.organizerRepository.findById(organizerId);
    if (!organizer) {
      throw new OrganizerNotFoundException(organizerId);
    }
  }
}
