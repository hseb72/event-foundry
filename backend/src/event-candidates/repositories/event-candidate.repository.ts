import { Injectable } from '@nestjs/common';
import { EventCandidateStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import { EVENT_REFS_INCLUDE, type EventWithRefs } from '../../events/entities/event.entity';
import type {
  EventCandidate,
  EventCandidateWithCreator,
  EventCandidateWithImport,
} from '../entities/event-candidate.entity';

const IMPORT_INCLUDE = { importJob: { include: { attachment: true } } } as const;

@Injectable()
export class EventCandidateRepository extends BaseRepository<EventCandidate> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<EventCandidate> {
    return this.prisma.eventCandidate as unknown as CrudDelegate<EventCandidate>;
  }

  list(params: {
    status?: EventCandidateStatus;
    importJobId?: string;
    skip: number;
    take: number;
  }): Promise<EventCandidate[]> {
    return this.prisma.eventCandidate.findMany({
      where: { status: params.status, importJobId: params.importJobId },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  listByImportJob(importJobId: string): Promise<EventCandidate[]> {
    return this.prisma.eventCandidate.findMany({
      where: { importJobId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Candidats issus des soumissions de l'utilisateur (FSPEC.22 §6 — espace personnel de qualification). */
  listForOwner(userId: string, status?: EventCandidateStatus): Promise<EventCandidate[]> {
    return this.prisma.eventCandidate.findMany({
      where: { status, importJob: { createdById: userId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Auteur de la soumission dont est issu un candidat (garde de propriété — FSPEC.22 §6). */
  ownerId(candidateId: string): Promise<string | null> {
    return this.prisma.eventCandidate
      .findUnique({ where: { id: candidateId }, select: { importJob: { select: { createdById: true } } } })
      .then((row) => row?.importJob.createdById ?? null);
  }

  /**
   * Provenance d'un candidat (auteur + organisation d'origine) — garde de propriété élargie à
   * l'équipe (FSPEC.22 : tout agent de l'organisation d'origine peut agir sur le brouillon).
   */
  provenance(candidateId: string): Promise<{ createdById: string | null; organizationId: string | null } | null> {
    return this.prisma.eventCandidate
      .findUnique({
        where: { id: candidateId },
        select: { importJob: { select: { createdById: true, organizationId: true } } },
      })
      .then((row) =>
        row
          ? {
              createdById: row.importJob.createdById,
              organizationId: row.importJob.organizationId,
            }
          : null,
      );
  }

  /**
   * Brouillons issus des soumissions d'une **organisation** (FSPEC.22 — vue partagée d'équipe), avec
   * le pseudo de l'auteur. Toute l'équipe qualifie les mêmes brouillons, les plus récents d'abord.
   */
  listForOrganization(
    organizationId: string,
    status?: EventCandidateStatus,
  ): Promise<EventCandidateWithCreator[]> {
    return this.prisma.eventCandidate.findMany({
      where: { status, importJob: { organizationId } },
      orderBy: { createdAt: 'desc' },
      include: { importJob: { include: { createdBy: { select: { displayName: true } } } } },
    });
  }

  findByIdWithImport(id: string): Promise<EventCandidateWithImport | null> {
    return this.prisma.eventCandidate.findUnique({ where: { id }, include: IMPORT_INCLUDE });
  }

  createFromClassification(input: {
    importJobId: string;
    payload: Prisma.InputJsonValue;
    confidence: Prisma.InputJsonValue;
  }): Promise<EventCandidate> {
    return this.prisma.eventCandidate.create({
      data: {
        importJobId: input.importJobId,
        status: EventCandidateStatus.PENDING,
        payload: input.payload,
        confidence: input.confidence,
      },
    });
  }

  correct(id: string, payload: Prisma.InputJsonValue, correctedBy: string): Promise<EventCandidate> {
    return this.prisma.eventCandidate.update({
      where: { id },
      data: {
        payload,
        status: EventCandidateStatus.CORRECTED,
        correctedBy,
        correctedAt: new Date(),
      },
    });
  }

  reject(id: string): Promise<EventCandidate> {
    return this.prisma.eventCandidate.update({
      where: { id },
      data: { status: EventCandidateStatus.REJECTED },
    });
  }

  /**
   * Crée l'Event et marque le candidate VALIDATED dans une même transaction (écriture
   * multi-cohérente — CLAUDE.md §6).
   */
  createEventAndValidate(
    candidateId: string,
    eventData: Prisma.EventUncheckedCreateInput,
    actorId: string,
  ): Promise<EventWithRefs> {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({ data: eventData, include: EVENT_REFS_INCLUDE });
      await tx.eventCandidate.update({
        where: { id: candidateId },
        data: { status: EventCandidateStatus.VALIDATED, eventId: event.id },
      });
      // Entrée dans le workflow de publication : journalise la transition initiale (→ DRAFT).
      await tx.eventStatusEvent.create({
        data: { eventId: event.id, fromStatus: null, toStatus: event.status, actorId },
      });
      return event;
    });
  }
}
