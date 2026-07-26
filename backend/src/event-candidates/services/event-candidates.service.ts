import { Injectable, Logger } from '@nestjs/common';
import { EventCandidateStatus, EventSource, EventStatus, EventVisibility, Prisma } from '@prisma/client';
import { CasesService } from '../../cases/cases.service';
import { CreateEventDto } from '../../events/dto/create-event.dto';
import type { EventWithRefs } from '../../events/entities/event.entity';
import { EventsService } from '../../events/services/events.service';
import { UpdateEventCandidateDto } from '../dto/update-event-candidate.dto';
import type {
  EventCandidate,
  EventCandidateWithImport,
} from '../entities/event-candidate.entity';
import {
  EventCandidateNotFoundException,
  InvalidCandidateTransitionException,
  SubmissionHeldForReviewException,
} from '../exceptions/event-candidate.exceptions';
import { EventCandidateRepository } from '../repositories/event-candidate.repository';
import {
  detectSubmissionAnomalies,
  type SubmissionAnomaly,
} from '../submission/submission-controls';

@Injectable()
export class EventCandidatesService {
  private readonly logger = new Logger(EventCandidatesService.name);

  constructor(
    private readonly repository: EventCandidateRepository,
    private readonly eventsService: EventsService,
    private readonly cases: CasesService,
  ) {}

  list(params: {
    status?: EventCandidateStatus;
    importJobId?: string;
    skip: number;
    take: number;
  }): Promise<EventCandidate[]> {
    return this.repository.list(params);
  }

  listByImportJob(importJobId: string): Promise<EventCandidate[]> {
    return this.repository.listByImportJob(importJobId);
  }

  async getDetail(id: string): Promise<EventCandidateWithImport> {
    const candidate = await this.repository.findByIdWithImport(id);
    if (!candidate) {
      throw new EventCandidateNotFoundException(id);
    }
    return candidate;
  }

  async correct(id: string, dto: UpdateEventCandidateDto, userId: string): Promise<EventCandidate> {
    await this.assertMutable(id);
    return this.repository.correct(id, dto.payload as Prisma.InputJsonValue, userId);
  }

  /** Validation : crée l'Event (source = IMPORT) et fige le candidate (transaction). */
  /**
   * Valide un candidate → crée l'Event (source = IMPORT). L'issue dépend du **rôle du valideur**
   * (FSPEC.22 §15-17) :
   * - **Organizer** (`canPublish`) : Event **PUBLIC** en **DRAFT**, il entre dans l'espace Organizer
   *   et pourra y être publié au catalogue.
   * - **Explorer** (sans droit de publication) : Event **PRIVATE** — événement personnel visible de
   *   son seul créateur, jamais diffusé au catalogue (ESUB-008/009). Il reste utilisable
   *   immédiatement (intérêt, réservation, planning).
   *
   * Dans les deux cas l'Event est **rattaché au valideur** (`createdById`).
   */
  async validate(
    id: string,
    dto: CreateEventDto,
    userId: string,
    canPublish: boolean,
  ): Promise<EventWithRefs> {
    await this.assertMutable(id);
    const base = await this.eventsService.buildValidatedEventData(dto, EventSource.IMPORT);

    // Contrôles automatiques (§13) : toute anomalie retient la validation et ouvre une Case.
    await this.runSubmissionControls(id, base, userId, canPublish);

    const eventData: Prisma.EventUncheckedCreateInput = {
      ...base,
      status: EventStatus.DRAFT,
      visibility: canPublish ? EventVisibility.PUBLIC : EventVisibility.PRIVATE,
      createdById: userId,
    };
    return this.repository.createEventAndValidate(id, eventData, userId);
  }

  /**
   * Exécute les contrôles automatiques déterministes (§13) sur le Draft. En cas d'anomalie, ouvre une
   * Case (file appropriée) puis lève une exception 422 : la validation est retenue, le Draft reste
   * modifiable (l'auteur corrige puis re-valide) et les autres Drafts ne sont pas affectés
   * (ESUB-004/006). Le doublon n'est contrôlé que pour le chemin publiable (un événement privé est
   * une copie personnelle légitime).
   */
  private async runSubmissionControls(
    candidateId: string,
    base: Prisma.EventUncheckedCreateInput,
    userId: string,
    canPublish: boolean,
  ): Promise<void> {
    const startsAt = new Date(base.startsAt as string | Date);
    const endsAt = base.endsAt ? new Date(base.endsAt as string | Date) : null;
    const title = base.title;
    const hasPublicDuplicate =
      canPublish && (await this.eventsService.hasPublicDuplicate(title, startsAt));

    const anomalies = detectSubmissionAnomalies({
      title,
      startsAt,
      endsAt,
      hasPublicDuplicate,
      checkDuplicate: canPublish,
    });
    if (anomalies.length === 0) {
      return;
    }

    const opened = await this.cases.open({
      // Un doublon relève de la modération de contenu ; une incohérence, d'une correction de données.
      type: anomalies.some((a) => a.kind === 'DUPLICATE') ? 'CONTENT_REPORT' : 'DATA_CORRECTION',
      subject: `Soumission à vérifier : ${title}`,
      description: anomalies.map((a) => a.message).join(' '),
      origin: canPublish ? 'ORGANIZER' : 'EXPLORER',
      requesterId: userId,
      metadata: {
        candidateId,
        anomalies: anomalies.map((a) => a.kind),
        details: anomalies.map((a) => a.message),
      },
    });
    this.logger.warn(
      `Validation retenue (candidate ${candidateId}) : ${anomalies.map((a) => a.kind).join(', ')} → Case ${opened.reference}`,
    );
    throw this.heldForReview(opened.reference, anomalies);
  }

  private heldForReview(reference: string, anomalies: SubmissionAnomaly[]): SubmissionHeldForReviewException {
    return new SubmissionHeldForReviewException(reference, anomalies);
  }

  async reject(id: string): Promise<EventCandidate> {
    await this.assertMutable(id);
    return this.repository.reject(id);
  }

  /** Un candidate VALIDATED ou REJECTED n'est plus modifiable (FSPEC.02). */
  private async assertMutable(id: string): Promise<EventCandidate> {
    const candidate = await this.repository.findById(id);
    if (!candidate) {
      throw new EventCandidateNotFoundException(id);
    }
    if (
      candidate.status === EventCandidateStatus.VALIDATED ||
      candidate.status === EventCandidateStatus.REJECTED
    ) {
      throw new InvalidCandidateTransitionException(candidate.status);
    }
    return candidate;
  }
}
