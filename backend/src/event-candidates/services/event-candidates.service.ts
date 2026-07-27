import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EventCandidateStatus, EventSource, EventStatus, EventVisibility, Prisma } from '@prisma/client';
import { CasesService } from '../../cases/cases.service';
import { ModerationTermsService } from '../../moderation/moderation-terms.service';
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

/**
 * Contexte de l'acteur agissant sur un candidat. Un **Operator** (droit `validation.review`) peut
 * qualifier n'importe quel candidat du pipeline ; tout autre utilisateur (Explorer soumettant ses
 * propres imports — FSPEC.22 §6) ne peut agir que sur **ses** candidats.
 */
export interface CandidateActor {
  userId: string;
  isOperator: boolean;
  /** Organisation active de l'acteur : fige l'origine d'un événement validé **publiable** (FSPEC.22). */
  activeOrganizationId: string | null;
}

@Injectable()
export class EventCandidatesService {
  private readonly logger = new Logger(EventCandidatesService.name);

  constructor(
    private readonly repository: EventCandidateRepository,
    private readonly eventsService: EventsService,
    private readonly cases: CasesService,
    private readonly moderationTerms: ModerationTermsService,
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

  /** Mes brouillons (FSPEC.22 §6) : les candidats issus de mes propres soumissions. */
  listMine(userId: string, status?: EventCandidateStatus): Promise<EventCandidate[]> {
    return this.repository.listForOwner(userId, status);
  }

  async getDetail(id: string, actor?: CandidateActor): Promise<EventCandidateWithImport> {
    const candidate = await this.repository.findByIdWithImport(id);
    if (!candidate) {
      throw new EventCandidateNotFoundException(id);
    }
    if (actor) {
      await this.assertOwnership(id, actor);
    }
    return candidate;
  }

  async correct(id: string, dto: UpdateEventCandidateDto, actor: CandidateActor): Promise<EventCandidate> {
    await this.assertMutable(id);
    await this.assertOwnership(id, actor);
    return this.repository.correct(id, dto.payload as Prisma.InputJsonValue, actor.userId);
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
    actor: CandidateActor,
    canPublish: boolean,
  ): Promise<EventWithRefs> {
    await this.assertMutable(id);
    await this.assertOwnership(id, actor);
    const base = await this.eventsService.buildValidatedEventData(dto, EventSource.IMPORT);

    // Contrôles automatiques (§13) : toute anomalie retient la validation et ouvre une Case.
    await this.runSubmissionControls(id, base, actor.userId, canPublish);

    const eventData: Prisma.EventUncheckedCreateInput = {
      ...base,
      status: EventStatus.DRAFT,
      visibility: canPublish ? EventVisibility.PUBLIC : EventVisibility.PRIVATE,
      createdById: actor.userId,
      // Origine durable (FSPEC.22) : un événement publiable est rattaché à l'organisation active de
      // l'acteur ; un événement privé personnel (Explorer) reste sans organisation.
      organizationId: canPublish ? actor.activeOrganizationId : null,
    };
    return this.repository.createEventAndValidate(id, eventData, actor.userId);
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
    // Contenu interdit / spam (§13) : contrôle déterministe sur le référentiel de modération.
    const prohibited = await this.moderationTerms.firstMatch(`${title} ${base.description ?? ''}`);

    const anomalies = detectSubmissionAnomalies({
      title,
      startsAt,
      endsAt,
      hasPublicDuplicate,
      checkDuplicate: canPublish,
      prohibited,
    });
    if (anomalies.length === 0) {
      return;
    }

    // Contenu interdit → abus (priorité haute) ; doublon → modération de contenu ; sinon correction.
    const caseType = anomalies.some((a) => a.kind === 'PROHIBITED_CONTENT')
      ? 'ABUSE_REPORT'
      : anomalies.some((a) => a.kind === 'DUPLICATE')
        ? 'CONTENT_REPORT'
        : 'DATA_CORRECTION';
    const opened = await this.cases.open({
      type: caseType,
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

  async reject(id: string, actor: CandidateActor): Promise<EventCandidate> {
    await this.assertMutable(id);
    await this.assertOwnership(id, actor);
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

  /**
   * Garde de propriété (FSPEC.22 §6) : un Operator (`validation.review`) agit sur tout candidat ;
   * un utilisateur ordinaire uniquement sur les candidats issus de ses propres soumissions.
   */
  private async assertOwnership(id: string, actor: CandidateActor): Promise<void> {
    if (actor.isOperator) {
      return;
    }
    const ownerId = await this.repository.ownerId(id);
    if (ownerId !== actor.userId) {
      throw new ForbiddenException("Ce brouillon n'est pas issu de vos soumissions.");
    }
  }
}
