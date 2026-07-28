import { Injectable } from '@nestjs/common';
import type { Modality } from '@prisma/client';
import { ModalityNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { ModalityRepository } from './modality.repository';
import { CreateModalityDto, UpdateModalityDto } from './modality.dto';

@Injectable()
export class ModalitiesService {
  constructor(private readonly repository: ModalityRepository) {}

  list(dimensionId: string | undefined, includeInactive: boolean): Promise<Modality[]> {
    return this.repository.list(dimensionId, includeInactive);
  }

  async getOrThrow(id: string): Promise<Modality> {
    const modality = await this.repository.findById(id);
    if (!modality) {
      throw new ModalityNotFoundException(id);
    }
    return modality;
  }

  async create(dto: CreateModalityDto): Promise<Modality> {
    try {
      return await this.repository.create({ name: dto.name, dimensionId: dto.dimensionId });
    } catch (error) {
      rethrowAsConflict(error, `Une Modality « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateModalityDto): Promise<Modality> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Modality « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<Modality> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
