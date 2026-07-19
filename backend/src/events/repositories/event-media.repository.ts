import { Injectable } from '@nestjs/common';
import type { EventMedia } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Seul point d'accès PostgreSQL des médias d'Event (Prisma confiné — ADR.02). */
@Injectable()
export class EventMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByEvent(eventId: string): Promise<EventMedia[]> {
    return this.prisma.eventMedia.findMany({ where: { eventId }, orderBy: { position: 'asc' } });
  }

  findById(id: string): Promise<EventMedia | null> {
    return this.prisma.eventMedia.findUnique({ where: { id } });
  }

  countByEvent(eventId: string): Promise<number> {
    return this.prisma.eventMedia.count({ where: { eventId } });
  }

  create(data: {
    eventId: string;
    objectKey: string;
    contentType: string;
    sizeBytes: number;
    position: number;
  }): Promise<EventMedia> {
    return this.prisma.eventMedia.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.eventMedia.delete({ where: { id } });
  }
}
