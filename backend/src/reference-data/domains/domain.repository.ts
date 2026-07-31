import { Injectable } from '@nestjs/common';
import type { Domain } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class DomainRepository extends ReferentialRepository<Domain> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Domain> {
    return this.prisma.domain as unknown as ReferentialDelegate<Domain>;
  }
}
