import { Injectable } from '@nestjs/common';
import type { Country } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class CountryRepository extends ReferentialRepository<Country> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Country> {
    return this.prisma.country as unknown as ReferentialDelegate<Country>;
  }
}
