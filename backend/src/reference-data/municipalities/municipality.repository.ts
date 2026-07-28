import { Injectable } from '@nestjs/common';
import type { Municipality } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';
import type { MunicipalityWithGeo } from './municipality.mapper';

@Injectable()
export class MunicipalityRepository extends ReferentialRepository<Municipality> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Municipality> {
    return this.prisma.municipality as unknown as ReferentialDelegate<Municipality>;
  }

  listByRegion(regionId: string, includeInactive: boolean): Promise<Municipality[]> {
    return this.prisma.municipality.findMany({
      where: { regionId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Liste paginée / triée / filtrée côté serveur (référentiel volumineux : communes GeoNames).
   * La recherche porte sur le nom et le code postal ; le tri est restreint par le service.
   */
  async listPaged(params: {
    includeInactive: boolean;
    regionId?: string;
    search?: string;
    sort: 'name' | 'postalCode' | 'createdAt';
    order: 'asc' | 'desc';
    skip: number;
    take: number;
  }): Promise<{ items: Municipality[]; total: number }> {
    const search = params.search?.trim();
    const where = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.regionId ? { regionId: params.regionId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { postalCode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    // Tri stable : critère demandé puis id pour départager (pagination déterministe).
    const orderBy = [{ [params.sort]: params.order }, { id: 'asc' as const }];
    const [items, total] = await Promise.all([
      this.prisma.municipality.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      this.prisma.municipality.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Résolution « pays + code postal → commune(s) » (Localisation V3, chantier §8.1). Renvoie les
   * communes actives du pays dont le code postal correspond, avec leur région/pays (région dérivée).
   * Peut renvoyer plusieurs communes (désambiguïsation côté client).
   */
  resolveByPostalCode(countryId: string, postalCode: string): Promise<MunicipalityWithGeo[]> {
    return this.prisma.municipality.findMany({
      where: { postalCode, isActive: true, region: { countryId } },
      include: { region: { include: { country: true } } },
      orderBy: { name: 'asc' },
    });
  }

  /** Commune enrichie de sa région et de son pays (pour préremplir la localisation en édition). */
  findWithGeo(id: string): Promise<MunicipalityWithGeo | null> {
    return this.prisma.municipality.findUnique({
      where: { id },
      include: { region: { include: { country: true } } },
    });
  }
}
