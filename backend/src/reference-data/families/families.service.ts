import { Injectable } from '@nestjs/common';
import type { ActivityFamily } from '@prisma/client';
import { ActivityFamilyNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { ActivityFamilyRepository } from './activity-family.repository';
import { CreateActivityFamilyDto, UpdateActivityFamilyDto } from './activity-family.dto';

@Injectable()
export class FamiliesService {
  constructor(private readonly repository: ActivityFamilyRepository) {}

  list(activityId: string | undefined, includeInactive: boolean): Promise<ActivityFamily[]> {
    return this.repository.list(activityId, includeInactive);
  }

  async getOrThrow(id: string): Promise<ActivityFamily> {
    const family = await this.repository.findById(id);
    if (!family) {
      throw new ActivityFamilyNotFoundException(id);
    }
    return family;
  }

  async create(dto: CreateActivityFamilyDto): Promise<ActivityFamily> {
    try {
      return await this.repository.create({ name: dto.name, activityId: dto.activityId });
    } catch (error) {
      rethrowAsConflict(error, `Une Family « ${dto.name} » existe déjà pour cette Activité.`);
    }
  }

  async update(id: string, dto: UpdateActivityFamilyDto): Promise<ActivityFamily> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Family « ${dto.name} » existe déjà pour cette Activité.`);
    }
  }

  async deactivate(id: string): Promise<ActivityFamily> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
