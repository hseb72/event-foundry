import { Injectable } from '@nestjs/common';
import type { Municipality } from '@prisma/client';
import { MunicipalityNotFoundException, RegionNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { RegionRepository } from '../regions/region.repository';
import { CreateMunicipalityDto, UpdateMunicipalityDto } from './municipality.dto';
import type { MunicipalityWithGeo } from './municipality.mapper';
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

  /** Champs de tri autorisés pour la liste paginée (liste blanche — jamais de tri arbitraire). */
  static readonly SORT_FIELDS = ['name', 'postalCode', 'createdAt'] as const;

  /** Liste paginée / triée / filtrée côté serveur (référentiel volumineux). */
  listPaged(params: {
    includeInactive: boolean;
    regionId?: string;
    search?: string;
    sort?: string;
    order?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: Municipality[]; total: number }> {
    const sort = (MunicipalitiesService.SORT_FIELDS as readonly string[]).includes(params.sort ?? '')
      ? (params.sort as 'name' | 'postalCode' | 'createdAt')
      : 'name';
    const order = params.order === 'desc' ? 'desc' : 'asc';
    const skip = Math.max(0, Number.isFinite(params.skip) ? (params.skip as number) : 0);
    const rawTake = Number.isFinite(params.take) ? (params.take as number) : 25;
    const take = Math.min(100, Math.max(1, rawTake));
    return this.repository.listPaged({
      includeInactive: params.includeInactive,
      regionId: params.regionId,
      search: params.search,
      sort,
      order,
      skip,
      take,
    });
  }

  /** Résout « pays + code postal → commune(s) » (Localisation V3, chantier §8.1). */
  resolveByPostalCode(countryId: string, postalCode: string): Promise<MunicipalityWithGeo[]> {
    return this.repository.resolveByPostalCode(countryId, postalCode.trim());
  }

  /** Vue géographique d'une commune (région/pays dérivés) — préremplissage en édition. */
  async getGeoOrThrow(id: string): Promise<MunicipalityWithGeo> {
    const municipality = await this.repository.findWithGeo(id);
    if (!municipality) {
      throw new MunicipalityNotFoundException(id);
    }
    return municipality;
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
