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

  /** Retourne, parmi `ids`, ceux qui correspondent à un Tag existant. */
  async findExistingIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.prisma.tag.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return rows.map((row) => row.id);
  }
}
