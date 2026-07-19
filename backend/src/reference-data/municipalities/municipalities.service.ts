import { Injectable } from '@nestjs/common';
import type { Municipality } from '@prisma/client';
import { MunicipalityNotFoundException, RegionNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { RegionRepository } from '../regions/region.repository';
import { CreateMunicipalityDto, UpdateMunicipalityDto } from './municipality.dto';
import { MunicipalityRepository } from './municipality.repository';

@Injectable()
export class MunicipalitiesService {
  constructor(
    private readonly repository: MunicipalityRepository,
    private readonly regionRepository: RegionRepository,
  ) {}

  list(includeInactive: boolean, regionId?: string): Promise<Municipality[]> {
    return regionId
      ? this.repository.listByRegion(regionId, includeInactive)
      : this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Municipality> {
    const municipality = await this.repository.findById(id);
    if (!municipality) {
      throw new MunicipalityNotFoundException(id);
    }
    return municipality;
  }

  async create(dto: CreateMunicipalityDto): Promise<Municipality> {
    const region = await this.regionRepository.findById(dto.regionId);
    if (!region) {
      throw new RegionNotFoundException(dto.regionId);
    }
    try {
      return await this.repository.create({
        name: dto.name,
        regionId: dto.regionId,
        postalCode: dto.postalCode ?? null,
      });
    } catch (error) {
      rethrowAsConflict(error, `Une Municipality « ${dto.name} » existe déjà dans cette Region.`);
    }
  }

  async update(id: string, dto: UpdateMunicipalityDto): Promise<Municipality> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Municipality « ${dto.name} » existe déjà dans cette Region.`);
    }
  }

  async deactivate(id: string): Promise<Municipality> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
