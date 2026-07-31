import { Injectable } from '@nestjs/common';
import type { Region } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class RegionRepository extends ReferentialRepository<Region> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Region> {
    return this.prisma.region as unknown as ReferentialDelegate<Region>;
  }

  listByCountry(countryId: string, includeInactive: boolean): Promise<Region[]> {
    return this.prisma.region.findMany({
      where: { countryId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: 'asc' },
    });
  }
}
