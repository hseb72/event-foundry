import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Accès PostgreSQL pour l'auto-provisioning des référentiels (ADR.24 — Prisma confiné au Repository).
 * Chaque méthode **résout d'abord** (nom, insensible à la casse ; alias pour l'activité) et ne
 * **crée** qu'en dernier recours, en état **provisoire**. On ne crée jamais un doublon d'un
 * référentiel existant. Distinct des repositories reference-data pour éviter un couplage de modules.
 */
@Injectable()
export class ReferentialProvisioningRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Résout une activité par nom ou alias ; crée une activité provisoire si un domaine est fourni. */
  async resolveOrCreateActivity(label: string, defaultDomainId: string | null): Promise<string | null> {
    const byName = await this.prisma.activity.findFirst({
      where: { name: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (byName) {
      return byName.id;
    }
    // Les alias portent désormais sur cinq référentiels : ne retenir que ceux visant une activité.
    const alias = await this.prisma.alias.findFirst({
      where: {
        value: { equals: label, mode: 'insensitive' },
        isActive: true,
        activityId: { not: null },
      },
      select: { activityId: true },
    });
    if (alias?.activityId) {
      return alias.activityId;
    }
    if (!defaultDomainId) {
      return null; // domaine ambigu / non configuré : on ne crée pas d'activité (repli validation).
    }
    const created = await this.prisma.activity.create({
      data: { name: label, domainId: defaultDomainId, provisional: true },
      select: { id: true },
    });
    return created.id;
  }

  /** Type **transverse** (DATA.01 v2.0) : résolution/création par nom, sans activité. */
  async resolveOrCreateEventType(label: string): Promise<void> {
    const existing = await this.prisma.eventType.findFirst({
      where: { name: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.eventType.create({ data: { name: label, provisional: true } });
    }
  }

  async resolveOrCreateOrganizer(label: string): Promise<void> {
    const existing = await this.prisma.organizer.findFirst({
      where: { name: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.organizer.create({ data: { name: label, provisional: true } });
    }
  }

  async resolveOrCreateVenue(label: string): Promise<void> {
    const existing = await this.prisma.venue.findFirst({
      where: { name: { equals: label, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!existing) {
      await this.prisma.venue.create({ data: { name: label, provisional: true } });
    }
  }
}
