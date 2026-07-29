import { Injectable } from '@nestjs/common';
import type { EventMedia } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Seul point d'accès PostgreSQL des couvertures d'Event (Prisma confiné — ADR.02). */
@Injectable()
export class EventCoverRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Images de plusieurs Events en **une seule** requête, triées par événement puis par position :
   * les vues en liste peuvent ainsi résoudre leur couverture sans N+1.
   *
   * Seules les images sont retenues — un PDF joint ne fait pas une couverture.
   */
  listImagesByEvents(eventIds: string[]): Promise<EventMedia[]> {
    return this.prisma.eventMedia.findMany({
      where: { eventId: { in: eventIds }, contentType: { startsWith: 'image/' } },
      orderBy: [{ eventId: 'asc' }, { position: 'asc' }],
    });
  }
}
