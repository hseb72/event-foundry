import { Injectable } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EVENT_REFS_INCLUDE, type EventWithRefsAndParticipation } from '../../events/entities/event.entity';

/** Une valeur de facette : un référentiel et le nombre d'événements publiés associés. */
export interface FacetCount {
  id: string;
  name: string;
  count: number;
}

export interface Facets {
  activities: FacetCount[];
  categories: FacetCount[];
  municipalities: FacetCount[];
  tags: FacetCount[];
}

const PUBLISHED: Prisma.EventWhereInput = { status: EventStatus.PUBLISHED, deletedAt: null };

/**
 * Accès en lecture au Catalog pour la découverte (facettes, sélection aléatoire). Discovery ne
 * possède aucune donnée : ce Repository ne fait que des lectures sur les événements publiés.
 */
@Injectable()
export class DiscoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Comptes par référentiel parmi les événements publiés (base de la navigation à facettes). */
  async facets(): Promise<Facets> {
    const [activities, categories, municipalities, tags] = await Promise.all([
      this.prisma.event.groupBy({ by: ['activityId'], where: PUBLISHED, _count: { _all: true } }),
      this.prisma.event.groupBy({
        by: ['categoryId'],
        where: { ...PUBLISHED, categoryId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ['municipalityId'],
        where: { ...PUBLISHED, municipalityId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.eventTag.groupBy({
        by: ['tagId'],
        where: { event: PUBLISHED },
        _count: { _all: true },
      }),
    ]);

    return {
      activities: await this.resolve(
        activities.map((row) => ({ id: row.activityId, count: row._count._all })),
        (ids) => this.prisma.activity.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      ),
      categories: await this.resolve(
        categories.map((row) => ({ id: row.categoryId as string, count: row._count._all })),
        (ids) => this.prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      ),
      municipalities: await this.resolve(
        municipalities.map((row) => ({ id: row.municipalityId as string, count: row._count._all })),
        (ids) => this.prisma.municipality.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      ),
      tags: await this.resolve(
        tags.map((row) => ({ id: row.tagId, count: row._count._all })),
        (ids) => this.prisma.tag.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      ),
    };
  }

  /** Sélection aléatoire d'événements publiés à venir (« Surprends-moi »). */
  async surprise(userId: string, take: number, now: Date): Promise<EventWithRefsAndParticipation[]> {
    const pool = await this.prisma.event.findMany({
      where: { ...PUBLISHED, startsAt: { gte: now } },
      include: { ...EVENT_REFS_INCLUDE, participations: { where: { userId } } },
      take: 100,
      orderBy: { startsAt: 'asc' },
    });
    return shuffle(pool).slice(0, take);
  }

  private async resolve(
    counts: { id: string; count: number }[],
    lookup: (ids: string[]) => Promise<{ id: string; name: string }[]>,
  ): Promise<FacetCount[]> {
    if (counts.length === 0) {
      return [];
    }
    const names = new Map((await lookup(counts.map((c) => c.id))).map((r) => [r.id, r.name]));
    return counts
      .map((c) => ({ id: c.id, name: names.get(c.id) ?? '—', count: c.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}

/** Mélange de Fisher-Yates (copie, sans effet de bord). */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
