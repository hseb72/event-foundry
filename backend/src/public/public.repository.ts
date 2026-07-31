import { Injectable } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { EVENT_REFS_INCLUDE, type EventWithRefs } from '../events/entities/event.entity';
import { PrismaService } from '../infra/prisma/prisma.service';

const PUBLISHED: Prisma.EventWhereInput = { status: EventStatus.PUBLISHED, deletedAt: null };

/**
 * Lecture publique du catalogue (page de garde). N'expose que des événements **publiés à venir** ;
 * aucune donnée utilisateur (participations, brouillons) n'est chargée. Quand une localisation est
 * fournie, on récupère une fenêtre large que le service triera par proximité (pas de PostGIS ici).
 */
@Injectable()
export class PublicRepository {
  constructor(private readonly prisma: PrismaService) {}

  upcoming(now: Date, take: number): Promise<EventWithRefs[]> {
    return this.prisma.event.findMany({
      where: { ...PUBLISHED, startsAt: { gte: now } },
      include: EVENT_REFS_INCLUDE,
      orderBy: { startsAt: 'asc' },
      take,
    });
  }
}
