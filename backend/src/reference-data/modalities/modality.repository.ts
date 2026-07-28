import { Injectable } from '@nestjs/common';
import type { Modality, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Repository du référentiel Modality (Axe C — terme d'une dimension). Seul point d'accès Prisma. */
@Injectable()
export class ModalityRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Modality | null> {
    return this.prisma.modality.findUnique({ where: { id } });
  }

  list(dimensionId?: string, includeInactive = false): Promise<Modality[]> {
    return this.prisma.modality.findMany({
      where: {
        ...(dimensionId ? { dimensionId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.ModalityUncheckedCreateInput): Promise<Modality> {
    return this.prisma.modality.create({ data });
  }

  update(id: string, data: Prisma.ModalityUncheckedUpdateInput): Promise<Modality> {
    return this.prisma.modality.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<Modality> {
    return this.prisma.modality.update({ where: { id }, data: { isActive: false } });
  }
}
