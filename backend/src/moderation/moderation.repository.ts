import { Injectable } from '@nestjs/common';
import { EventStatus, type ModerationLog } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/**
 * Accès PostgreSQL de la modération (Prisma confiné). Applique les décisions aux objets publiés
 * (événement masqué/rétabli, organisation suspendue/rétablie) et tient le journal immuable des
 * décisions (MOD-003/005 : les contenus suspendus restent conservés, jamais supprimés en 20-A).
 */
@Injectable()
export class ModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  eventExists(id: string): Promise<boolean> {
    return this.prisma.event.findUnique({ where: { id }, select: { id: true } }).then((e) => e != null);
  }

  setEventStatus(id: string, status: EventStatus): Promise<unknown> {
    return this.prisma.event.update({ where: { id }, data: { status } });
  }

  organizationExists(id: string): Promise<boolean> {
    return this.prisma.organization.findUnique({ where: { id }, select: { id: true } }).then((o) => o != null);
  }

  setOrganizationActive(id: string, isActive: boolean): Promise<unknown> {
    return this.prisma.organization.update({ where: { id }, data: { isActive } });
  }

  recordLog(input: {
    objectType: string;
    objectId: string;
    decision: string;
    justification: string | null;
    operatorId: string | null;
    caseId: string | null;
  }): Promise<ModerationLog> {
    return this.prisma.moderationLog.create({ data: input });
  }

  /** Historique de modération d'un objet (§15). */
  history(objectType: string, objectId: string): Promise<ModerationLog[]> {
    return this.prisma.moderationLog.findMany({
      where: { objectType, objectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
