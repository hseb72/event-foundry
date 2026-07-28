import { Injectable } from '@nestjs/common';
import type { Prisma, Subject } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Repository du référentiel Subject (Axe A — le « sujet lui-même »). Seul point d'accès Prisma. */
@Injectable()
export class SubjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Subject | null> {
    return this.prisma.subject.findUnique({ where: { id } });
  }

  /** Filtrable par Family, ou par Activité (via la Family parente). */
  list(params: { familyId?: string; activityId?: string; includeInactive?: boolean }): Promise<Subject[]> {
    const { familyId, activityId, includeInactive } = params;
    return this.prisma.subject.findMany({
      where: {
        ...(familyId ? { familyId } : {}),
        ...(activityId ? { family: { activityId } } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: Prisma.SubjectUncheckedCreateInput): Promise<Subject> {
    return this.prisma.subject.create({ data });
  }

  update(id: string, data: Prisma.SubjectUncheckedUpdateInput): Promise<Subject> {
    return this.prisma.subject.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<Subject> {
    return this.prisma.subject.update({ where: { id }, data: { isActive: false } });
  }
}
