import { Injectable } from '@nestjs/common';
import type { Municipality } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

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
}
