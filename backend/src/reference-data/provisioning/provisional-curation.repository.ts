import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Types de référentiels auto-provisionnables (ADR.24). */
export type ProvisionalType = 'activity' | 'eventType' | 'eventFormat' | 'organizer' | 'venue';

/** Une entrée provisoire, avec son contexte (activité parente pour type/format). */
export interface ProvisionalEntry {
  type: ProvisionalType;
  id: string;
  name: string;
  context: string | null;
  createdAt: string;
}

/**
 * Accès PostgreSQL de la file de curation des référentiels provisoires (ADR.24 — Prisma confiné au
 * Repository). Agrège les entrées `provisional = true` des cinq référentiels auto-provisionnables ;
 * permet de confirmer (lever le drapeau) ou supprimer une entrée.
 */
@Injectable()
export class ProvisionalCurationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ProvisionalEntry[]> {
    const [activities, eventTypes, eventFormats, organizers, venues] = await Promise.all([
      this.prisma.activity.findMany({
        where: { provisional: true },
        select: { id: true, name: true, createdAt: true, domain: { select: { name: true } } },
      }),
      this.prisma.eventType.findMany({
        where: { provisional: true },
        select: { id: true, name: true, createdAt: true, activity: { select: { name: true } } },
      }),
      this.prisma.eventFormat.findMany({
        where: { provisional: true },
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.organizer.findMany({
        where: { provisional: true },
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.venue.findMany({
        where: { provisional: true },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    const entries: ProvisionalEntry[] = [
      ...activities.map((a) => this.entry('activity', a.id, a.name, a.domain.name, a.createdAt)),
      ...eventTypes.map((t) => this.entry('eventType', t.id, t.name, t.activity.name, t.createdAt)),
      ...eventFormats.map((f) => this.entry('eventFormat', f.id, f.name, null, f.createdAt)),
      ...organizers.map((o) => this.entry('organizer', o.id, o.name, null, o.createdAt)),
      ...venues.map((v) => this.entry('venue', v.id, v.name, null, v.createdAt)),
    ];
    return entries.sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  }

  /** Lève le drapeau provisoire : l'entrée devient un référentiel curé ordinaire. */
  async confirm(type: ProvisionalType, id: string): Promise<void> {
    await this.delegate(type).update({ where: { id }, data: { provisional: false } });
  }

  /** Supprime une entrée provisoire (RESTRICT protège : refus si un événement la référence). */
  async remove(type: ProvisionalType, id: string): Promise<void> {
    await this.delegate(type).delete({ where: { id } });
  }

  private delegate(type: ProvisionalType): ProvisionalDelegate {
    const map: Record<ProvisionalType, unknown> = {
      activity: this.prisma.activity,
      eventType: this.prisma.eventType,
      eventFormat: this.prisma.eventFormat,
      organizer: this.prisma.organizer,
      venue: this.prisma.venue,
    };
    return map[type] as ProvisionalDelegate;
  }

  private entry(
    type: ProvisionalType,
    id: string,
    name: string,
    context: string | null,
    createdAt: Date,
  ): ProvisionalEntry {
    return { type, id, name, context, createdAt: createdAt.toISOString() };
  }
}

/** Sous-ensemble commun aux délégués Prisma des référentiels provisionnables. */
interface ProvisionalDelegate {
  update(args: { where: { id: string }; data: { provisional: boolean } }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
}
