import { Injectable } from '@nestjs/common';
import type { Tag } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class TagRepository extends ReferentialRepository<Tag> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Tag> {
    return this.prisma.tag as unknown as ReferentialDelegate<Tag>;
  }
}
