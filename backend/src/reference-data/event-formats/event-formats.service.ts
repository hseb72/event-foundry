import { Injectable } from '@nestjs/common';
import type { EventFormat } from '@prisma/client';
import { EventFormatNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateEventFormatDto, UpdateEventFormatDto } from './event-format.dto';
import { EventFormatRepository } from './event-format.repository';

/** Format d'événement : référentiel **transverse** (DATA.01 §4), indépendant de l'Activité. */
@Injectable()
export class EventFormatsService {
  constructor(private readonly repository: EventFormatRepository) {}

  list(includeInactive: boolean): Promise<EventFormat[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<EventFormat> {
    const eventFormat = await this.repository.findById(id);
    if (!eventFormat) {
      throw new EventFormatNotFoundException(id);
    }
    return eventFormat;
  }

  async create(dto: CreateEventFormatDto): Promise<EventFormat> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Un EventFormat « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateEventFormatDto): Promise<EventFormat> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un EventFormat « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<EventFormat> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
