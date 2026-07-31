import { Injectable } from '@nestjs/common';
import type { ModalityDimension, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type ModalityDimensionWithModalities = Prisma.ModalityDimensionGetPayload<{
  include: { modalities: true };
}>;

/** Repository du référentiel ModalityDimension (Axe C). Seul point d'accès Prisma. */
@Injectable()
export class ModalityDimensionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ModalityDimension | null> {
    return this.prisma.modalityDimension.findUnique({ where: { id } });
  }

  /** Dimensions avec leurs modalités (picker groupé). */
  list(includeInactive = false): Promise<ModalityDimensionWithModalities[]> {
    return this.prisma.modalityDimension.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        modalities: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.ModalityDimensionUncheckedCreateInput): Promise<ModalityDimension> {
    return this.prisma.modalityDimension.create({ data });
  }

  update(id: string, data: Prisma.ModalityDimensionUncheckedUpdateInput): Promise<ModalityDimension> {
    return this.prisma.modalityDimension.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<ModalityDimension> {
    return this.prisma.modalityDimension.update({ where: { id }, data: { isActive: false } });
  }
}
