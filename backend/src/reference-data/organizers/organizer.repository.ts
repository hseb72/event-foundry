import { Injectable } from '@nestjs/common';
import type { Organizer } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class OrganizerRepository extends ReferentialRepository<Organizer> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Organizer> {
    return this.prisma.organizer as unknown as ReferentialDelegate<Organizer>;
  }
}
