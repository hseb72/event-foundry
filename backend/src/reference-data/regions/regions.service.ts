import { Injectable } from '@nestjs/common';
import type { Region } from '@prisma/client';
import { CountryNotFoundException, RegionNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CountryRepository } from '../countries/country.repository';
import { CreateRegionDto, UpdateRegionDto } from './region.dto';
import { RegionRepository } from './region.repository';

@Injectable()
export class RegionsService {
  constructor(
    private readonly repository: RegionRepository,
    private readonly countryRepository: CountryRepository,
  ) {}

  list(includeInactive: boolean, countryId?: string): Promise<Region[]> {
    return countryId
      ? this.repository.listByCountry(countryId, includeInactive)
      : this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Region> {
    const region = await this.repository.findById(id);
    if (!region) {
      throw new RegionNotFoundException(id);
    }
    return region;
  }

  async create(dto: CreateRegionDto): Promise<Region> {
    const country = await this.countryRepository.findById(dto.countryId);
    if (!country) {
      throw new CountryNotFoundException(dto.countryId);
    }
    try {
      return await this.repository.create({ name: dto.name, countryId: dto.countryId });
    } catch (error) {
      rethrowAsConflict(error, `Une Region « ${dto.name} » existe déjà dans ce Country.`);
    }
  }

  async update(id: string, dto: UpdateRegionDto): Promise<Region> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Region « ${dto.name} » existe déjà dans ce Country.`);
    }
  }

  async deactivate(id: string): Promise<Region> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
