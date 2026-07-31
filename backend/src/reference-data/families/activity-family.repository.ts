import { Injectable } from '@nestjs/common';
import type { ActivityFamily, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Repository du référentiel Family (Axe A — DATA.01 v2.0). Seul point d'accès Prisma. */
@Injectable()
export class ActivityFamilyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ActivityFamily | null> {
    return this.prisma.activityFamily.findUnique({ where: { id } });
  }

  list(activityId?: string, includeInactive = false): Promise<ActivityFamily[]> {
    return this.prisma.activityFamily.findMany({
      where: {
        ...(activityId ? { activityId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.ActivityFamilyUncheckedCreateInput): Promise<ActivityFamily> {
    return this.prisma.activityFamily.create({ data });
  }

  update(id: string, data: Prisma.ActivityFamilyUncheckedUpdateInput): Promise<ActivityFamily> {
    return this.prisma.activityFamily.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<ActivityFamily> {
    return this.prisma.activityFamily.update({ where: { id }, data: { isActive: false } });
  }
}
