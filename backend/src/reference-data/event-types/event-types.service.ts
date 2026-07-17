import { Injectable } from '@nestjs/common';
import type { EventType } from '@prisma/client';
import { ActivityRepository } from '../activities/activity.repository';
import { ActivityNotFoundException, EventTypeNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateEventTypeDto, UpdateEventTypeDto } from './event-type.dto';
import { EventTypeRepository } from './event-type.repository';

@Injectable()
export class EventTypesService {
  constructor(
    private readonly repository: EventTypeRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  list(includeInactive: boolean, activityId?: string): Promise<EventType[]> {
    return activityId
      ? this.repository.listByActivity(activityId, includeInactive)
      : this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<EventType> {
    const eventType = await this.repository.findById(id);
    if (!eventType) {
      throw new EventTypeNotFoundException(id);
    }
    return eventType;
  }

  async create(dto: CreateEventTypeDto): Promise<EventType> {
    const activity = await this.activityRepository.findById(dto.activityId);
    if (!activity) {
      throw new ActivityNotFoundException(dto.activityId);
    }
    try {
      return await this.repository.create({ name: dto.name, activityId: dto.activityId });
    } catch (error) {
      rethrowAsConflict(error, `Un EventType « ${dto.name} » existe déjà pour cette Activity.`);
    }
  }

  async update(id: string, dto: UpdateEventTypeDto): Promise<EventType> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un EventType « ${dto.name} » existe déjà pour cette Activity.`);
    }
  }

  async deactivate(id: string): Promise<EventType> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
