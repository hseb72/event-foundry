import { Injectable } from '@nestjs/common';
import type { Country } from '@prisma/client';
import { CountryNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateCountryDto, UpdateCountryDto } from './country.dto';
import { CountryRepository } from './country.repository';

@Injectable()
export class CountriesService {
  constructor(private readonly repository: CountryRepository) {}

  list(includeInactive: boolean): Promise<Country[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Country> {
    const country = await this.repository.findById(id);
    if (!country) {
      throw new CountryNotFoundException(id);
    }
    return country;
  }

  async create(dto: CreateCountryDto): Promise<Country> {
    try {
      return await this.repository.create({ name: dto.name, code: dto.code ?? null });
    } catch (error) {
      rethrowAsConflict(error, `Un Country « ${dto.name} » (ou ce code) existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un Country « ${dto.name} » (ou ce code) existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<Country> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}
