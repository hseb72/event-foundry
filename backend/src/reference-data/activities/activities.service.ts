import { Injectable } from '@nestjs/common';
import type { Activity } from '@prisma/client';
import { ActivityNotFoundException, DomainNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { DomainRepository } from '../domains/domain.repository';
import { CreateActivityDto, UpdateActivityDto } from './activity.dto';
import { ActivityRepository } from './activity.repository';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly repository: ActivityRepository,
    private readonly domainRepository: DomainRepository,
  ) {}

  list(includeInactive: boolean, domainId?: string): Promise<Activity[]> {
    return domainId
      ? this.repository.listByDomain(domainId, includeInactive)
      : this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Activity> {
    const activity = await this.repository.findById(id);
    if (!activity) {
      throw new ActivityNotFoundException(id);
    }
    return activity;
  }

  async create(dto: CreateActivityDto): Promise<Activity> {
    const domain = await this.domainRepository.findById(dto.domainId);
    if (!domain) {
      throw new DomainNotFoundException(dto.domainId);
    }
    try {
      return await this.repository.create({ name: dto.name, domainId: dto.domainId });
    } catch (error) {
      rethrowAsConflict(error, `Une Activity « ${dto.name} » existe déjà dans ce Domain.`);
    }
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Activity « ${dto.name} » existe déjà dans ce Domain.`);
    }
  }

  async deactivate(id: string): Promise<Activity> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
