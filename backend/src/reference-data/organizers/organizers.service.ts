import { Injectable } from '@nestjs/common';
import type { Organizer } from '@prisma/client';
import { OrganizerNotFoundException } from '../common/exceptions';
import { CreateOrganizerDto, UpdateOrganizerDto } from './organizer.dto';
import { OrganizerRepository } from './organizer.repository';

@Injectable()
export class OrganizersService {
  constructor(private readonly repository: OrganizerRepository) {}

  list(includeInactive: boolean): Promise<Organizer[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Organizer> {
    const organizer = await this.repository.findById(id);
    if (!organizer) {
      throw new OrganizerNotFoundException(id);
    }
    return organizer;
  }

  create(dto: CreateOrganizerDto): Promise<Organizer> {
    return this.repository.create({ name: dto.name, website: dto.website ?? null });
  }

  async update(id: string, dto: UpdateOrganizerDto): Promise<Organizer> {
    await this.getOrThrow(id);
    return this.repository.update(id, dto);
  }

  async deactivate(id: string): Promise<Organizer> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
