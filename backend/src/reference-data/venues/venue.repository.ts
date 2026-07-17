import { Injectable } from '@nestjs/common';
import type { Venue } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class VenueRepository extends ReferentialRepository<Venue> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Venue> {
    return this.prisma.venue as unknown as ReferentialDelegate<Venue>;
  }
}
