import { Injectable } from '@nestjs/common';
import type { EventFormat } from '@prisma/client';
import { ActivityRepository } from '../activities/activity.repository';
import { ActivityNotFoundException, EventFormatNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateEventFormatDto, UpdateEventFormatDto } from './event-format.dto';
import { EventFormatRepository } from './event-format.repository';

@Injectable()
export class EventFormatsService {
  constructor(
    private readonly repository: EventFormatRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  list(includeInactive: boolean, activityId?: string): Promise<EventFormat[]> {
    return activityId
      ? this.repository.listByActivity(activityId, includeInactive)
      : this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<EventFormat> {
    const eventFormat = await this.repository.findById(id);
    if (!eventFormat) {
      throw new EventFormatNotFoundException(id);
    }
    return eventFormat;
  }

  async create(dto: CreateEventFormatDto): Promise<EventFormat> {
    const activity = await this.activityRepository.findById(dto.activityId);
    if (!activity) {
      throw new ActivityNotFoundException(dto.activityId);
    }
    try {
      return await this.repository.create({ name: dto.name, activityId: dto.activityId });
    } catch (error) {
      rethrowAsConflict(error, `Un EventFormat « ${dto.name} » existe déjà pour cette Activity.`);
    }
  }

  async update(id: string, dto: UpdateEventFormatDto): Promise<EventFormat> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un EventFormat « ${dto.name} » existe déjà pour cette Activity.`);
    }
  }

  async deactivate(id: string): Promise<EventFormat> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
