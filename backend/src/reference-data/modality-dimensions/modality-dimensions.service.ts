import { Injectable } from '@nestjs/common';
import type { ModalityDimension } from '@prisma/client';
import { ModalityDimensionNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import {
  ModalityDimensionRepository,
  ModalityDimensionWithModalities,
} from './modality-dimension.repository';
import { CreateModalityDimensionDto, UpdateModalityDimensionDto } from './modality-dimension.dto';

@Injectable()
export class ModalityDimensionsService {
  constructor(private readonly repository: ModalityDimensionRepository) {}

  list(includeInactive: boolean): Promise<ModalityDimensionWithModalities[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<ModalityDimension> {
    const dimension = await this.repository.findById(id);
    if (!dimension) {
      throw new ModalityDimensionNotFoundException(id);
    }
    return dimension;
  }

  async create(dto: CreateModalityDimensionDto): Promise<ModalityDimension> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Une dimension « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateModalityDimensionDto): Promise<ModalityDimension> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une dimension « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<ModalityDimension> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
