import { Injectable } from '@nestjs/common';
import type { EventType } from '@prisma/client';
import { EventTypeNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateEventTypeDto, UpdateEventTypeDto } from './event-type.dto';
import { EventTypeRepository } from './event-type.repository';

@Injectable()
export class EventTypesService {
  constructor(private readonly repository: EventTypeRepository) {}

  list(includeInactive: boolean): Promise<EventType[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<EventType> {
    const eventType = await this.repository.findById(id);
    if (!eventType) {
      throw new EventTypeNotFoundException(id);
    }
    return eventType;
  }

  async create(dto: CreateEventTypeDto): Promise<EventType> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Un EventType « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateEventTypeDto): Promise<EventType> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un EventType « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<EventType> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
