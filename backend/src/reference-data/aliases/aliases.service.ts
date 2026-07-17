import { Injectable } from '@nestjs/common';
import type { Alias } from '@prisma/client';
import { ActivityRepository } from '../activities/activity.repository';
import { ActivityNotFoundException, AliasNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateAliasDto, UpdateAliasDto } from './alias.dto';
import { AliasRepository } from './alias.repository';

@Injectable()
export class AliasesService {
  constructor(
    private readonly repository: AliasRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async listByActivity(activityId: string, includeInactive: boolean): Promise<Alias[]> {
    await this.assertActivityExists(activityId);
    return this.repository.listByActivity(activityId, includeInactive);
  }

  async getOrThrow(id: string): Promise<Alias> {
    const alias = await this.repository.findById(id);
    if (!alias) {
      throw new AliasNotFoundException(id);
    }
    return alias;
  }

  async create(activityId: string, dto: CreateAliasDto): Promise<Alias> {
    await this.assertActivityExists(activityId);
    try {
      return await this.repository.create({ value: dto.value, activityId });
    } catch (error) {
      rethrowAsConflict(error, `L'alias « ${dto.value} » est déjà utilisé.`);
    }
  }

  async update(id: string, dto: UpdateAliasDto): Promise<Alias> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `L'alias « ${dto.value} » est déjà utilisé.`);
    }
  }

  async deactivate(id: string): Promise<Alias> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }

  private async assertActivityExists(activityId: string): Promise<void> {
    const activity = await this.activityRepository.findById(activityId);
    if (!activity) {
      throw new ActivityNotFoundException(activityId);
    }
  }
}
