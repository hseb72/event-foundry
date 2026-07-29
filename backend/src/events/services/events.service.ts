import { Injectable } from '@nestjs/common';
import { EventSource, EventStatus, EventVisibility, Prisma } from '@prisma/client';
import {
  ActivityNotFoundException,
  ModalityNotFoundException,
  MunicipalityNotFoundException,
  OrganizerNotFoundException,
  SubjectNotFoundException,
  VenueNotFoundException,
} from '../../reference-data/common/exceptions';
import { ActivityRepository } from '../../reference-data/activities/activity.repository';
import { EventTypeRepository } from '../../reference-data/event-types/event-type.repository';
import { ModalityRepository } from '../../reference-data/modalities/modality.repository';
import { MunicipalityRepository } from '../../reference-data/municipalities/municipality.repository';
import { OrganizerRepository } from '../../reference-data/organizers/organizer.repository';
import { SubjectRepository } from '../../reference-data/subjects/subject.repository';
import { TagRepository } from '../../reference-data/tags/tag.repository';
import { VenueRepository } from '../../reference-data/venues/venue.repository';
import { computeDateRange } from '../date-range.util';
import { CalendarQueryDto } from '../dto/calendar-query.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import type { EventWithRefs, EventWithRefsAndParticipation } from '../entities/event.entity';
import {
  EventNotEditableException,
  EventNotFoundException,
  InvalidEventTypeException,
  InvalidTagsException,
} from '../exceptions/event-validation.exceptions';
import { EventRepository } from '../repositories/event.repository';

/** Statuts dans lesquels un Event reste éditable (travail en cours, non diffusé). */
const EDITABLE_STATUSES: EventStatus[] = [EventStatus.DRAFT, EventStatus.SUBMITTED];

@Injectable()
export class EventsService {
  constructor(
    private readonly repository: EventRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly eventTypeRepository: EventTypeRepository,
    private readonly organizerRepository: OrganizerRepository,
    private readonly venueRepository: VenueRepository,
    private readonly municipalityRepository: MunicipalityRepository,
    private readonly tagRepository: TagRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly modalityRepository: ModalityRepository,
  ) {}

  async getOrThrow(id: string): Promise<EventWithRefs> {
    const event = await this.repository.findByIdWithRefs(id);
    if (!event) {
      throw new EventNotFoundException(id);
    }
    return event;
  }

  /**
   * Lecture d'un Event pour un utilisateur donné, avec **garde de visibilité** (FSPEC.22 §15) : un
   * événement **privé** n'est accessible qu'à son créateur. Pour tout autre lecteur, il est traité
   * comme inexistant (on n'en révèle pas l'existence).
   */
  async getForReader(id: string, userId: string): Promise<EventWithRefs> {
    const event = await this.getOrThrow(id);
    if (event.visibility === EventVisibility.PRIVATE && event.createdById !== userId) {
      throw new EventNotFoundException(id);
    }
    return event;
  }

  /**
   * Événements **privés** d'un Explorer (FSPEC.22 §15) : ses propres événements personnels, non
   * diffusés au catalogue. Triés du plus récent au plus ancien.
   */
  listPrivateEvents(userId: string): Promise<EventWithRefsAndParticipation[]> {
    return this.repository.listPrivateForCreator(userId);
  }

  /** Recherche paginée (FSPEC.04). Filtres cumulables ; par défaut, événements à venir. */
  async search(
    userId: string,
    query: SearchEventsQueryDto,
    activeOrganizationId: string | null = null,
  ): Promise<{
    items: EventWithRefsAndParticipation[];
    total: number;
    skip: number;
    take: number;
  }> {
    // Vue « espace Organizer » : liste des événements gérés (createdByMe ou périmètre organisation).
    const organizerView = Boolean(query.createdByMe || query.organizationScope);
    // Découverte : par défaut, événements à venir. Espace Organizer : aucune borne temporelle par
    // défaut — l'organisateur voit tous ses événements (passés, archivés compris), sauf filtre explicite.
    const hasExplicitRange = Boolean(query.period || query.from || query.to);
    const range =
      hasExplicitRange || !organizerView
        ? computeDateRange({ period: query.period, from: query.from, to: query.to })
        : {};
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    // Périmètre organisation (FSPEC.22) : les événements de l'organisation active ; en mode autonome
    // (aucune organisation active), mes propres événements sans organisation.
    const orgScope = query.organizationScope
      ? activeOrganizationId
        ? { organizationId: activeOrganizationId }
        : { autonomousCreatorId: userId }
      : {};

    const { items, total } = await this.repository.searchPaginated({
      userId,
      activityId: query.activityId,
      eventTypeId: query.eventTypeId,
      eventFormatId: query.eventFormatId,
      organizerId: query.organizerId,
      venueId: query.venueId,
      categoryId: query.categoryId,
      municipalityId: query.municipalityId,
      tagId: query.tagId,
      createdById: query.createdByMe && !query.organizationScope ? userId : undefined,
      ...orgScope,
      sort: query.sort,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      // Découverte : par défaut, seuls les événements publiés. L'espace Organizer liste tous statuts.
      status: query.status ?? (organizerView ? undefined : EventStatus.PUBLISHED),
      city: query.city,
      text: query.q,
      participationScope: query.participation ?? 'all',
      startsFrom: range.startsFrom,
      startsTo: range.startsTo,
      skip,
      take,
    });

    return { items, total, skip, take };
  }

  /**
   * Calendrier personnel (FSPEC.05) : événements ayant une participation de l'utilisateur.
   * Par défaut, aucune borne temporelle (les événements passés restent consultables).
   */
  getCalendar(userId: string, query: CalendarQueryDto): Promise<EventWithRefsAndParticipation[]> {
    const range =
      query.period || query.from || query.to
        ? computeDateRange({ period: query.period, from: query.from, to: query.to })
        : {};
    return this.repository.listCalendarForUser(userId, range.startsFrom, range.startsTo);
  }

  /**
   * Création manuelle (source = MANUAL) : l'organisateur crée un brouillon (workflow Publishing).
   * `organizationId` fige l'**origine** de l'événement (FSPEC.22) : renseigné = créé dans le cadre
   * d'une organisation ; null = organisateur autonome. Un événement privé personnel ne passe pas ici.
   */
  async createManual(
    dto: CreateEventDto,
    actorId: string,
    organizationId: string | null = null,
  ): Promise<EventWithRefs> {
    const data = await this.buildValidatedEventData(dto, EventSource.MANUAL);
    const event = await this.repository.createWithRefs({
      ...data,
      status: EventStatus.DRAFT,
      createdById: actorId,
      organizationId,
    });
    await this.repository.recordStatusEvent(event.id, null, EventStatus.DRAFT, actorId);
    return event;
  }

  /**
   * Création manuelle d'un **événement privé personnel** (expérience Explorer — FSPEC.22 §15). Même
   * saisie que la création Organizer, mais l'événement reste `PRIVATE` (visible du seul créateur,
   * jamais publié — ESUB-009) et sans organisation. Homogénéise l'entonnoir de soumission Explorer.
   */
  async createPrivateManual(dto: CreateEventDto, actorId: string): Promise<EventWithRefs> {
    const data = await this.buildValidatedEventData(dto, EventSource.MANUAL);
    const event = await this.repository.createWithRefs({
      ...data,
      status: EventStatus.DRAFT,
      visibility: EventVisibility.PRIVATE,
      createdById: actorId,
      organizationId: null,
    });
    await this.repository.recordStatusEvent(event.id, null, EventStatus.DRAFT, actorId);
    return event;
  }

  /**
   * Archive un **événement privé** de l'utilisateur (action personnelle — FSPEC.22 §15). Garde de
   * propriété : seul le créateur d'un événement privé peut l'archiver ; sinon il est traité comme
   * inexistant (on n'en révèle pas l'existence). Aucun impact catalogue (un privé n'y figure jamais).
   */
  async archivePrivate(id: string, userId: string): Promise<EventWithRefs> {
    const event = await this.assertOwnPrivate(id, userId);
    if (event.status === EventStatus.ARCHIVED) {
      return event;
    }
    return this.repository.applyTransition(id, event.status, EventStatus.ARCHIVED, userId);
  }

  /** Restaure un événement privé archivé (→ DRAFT). Même garde de propriété que l'archivage. */
  async restorePrivate(id: string, userId: string): Promise<EventWithRefs> {
    const event = await this.assertOwnPrivate(id, userId);
    if (event.status !== EventStatus.ARCHIVED) {
      return event;
    }
    return this.repository.applyTransition(id, event.status, EventStatus.DRAFT, userId);
  }

  /** Garde de propriété d'un événement privé : existe, PRIVATE, et créé par l'utilisateur. */
  private async assertOwnPrivate(id: string, userId: string): Promise<EventWithRefs> {
    const event = await this.getOrThrow(id);
    if (event.visibility !== EventVisibility.PRIVATE || event.createdById !== userId) {
      throw new EventNotFoundException(id);
    }
    return event;
  }

  /**
   * Correction d'un Event (FSPEC.13 « Modifié » / TSPEC.05 Update Publication). Permet à
   * l'organisateur de corriger une erreur (ex. dates incohérentes) sans repartir de zéro. Seuls les
   * brouillons et événements soumis sont éditables ; un événement publié doit d'abord être dépublié.
   * Sémantique de remplacement complet du formulaire (les champs absents sont réinitialisés). La
   * provenance et le statut ne changent jamais ; les tags sont intégralement remplacés.
   */
  async update(id: string, dto: UpdateEventDto): Promise<EventWithRefs> {
    return this.applyUpdate(await this.getOrThrow(id), dto);
  }

  /**
   * Vue d'édition d'un **événement privé** dont l'utilisateur est l'auteur (FSPEC.22 §15). Permet à
   * un Explorer de corriger son propre événement personnel sans disposer de `event.update`, qui
   * relève de l'espace Organizer.
   */
  getPrivateForEdit(id: string, userId: string): Promise<EventWithRefs> {
    return this.assertOwnPrivate(id, userId);
  }

  /**
   * Correction d'un **événement privé** par son auteur (FSPEC.22 §15). Mêmes règles de fond que la
   * correction d'un événement d'organisation (statuts éditables, remplacement complet), mais gardée
   * par la **propriété** plutôt que par la permission `event.update`.
   */
  async updatePrivate(id: string, dto: UpdateEventDto, userId: string): Promise<EventWithRefs> {
    return this.applyUpdate(await this.assertOwnPrivate(id, userId), dto);
  }

  /** Corps commun des corrections : contrôle du statut éditable puis remplacement des champs. */
  private async applyUpdate(event: EventWithRefs, dto: UpdateEventDto): Promise<EventWithRefs> {
    const id = event.id;
    if (!EDITABLE_STATUSES.includes(event.status)) {
      throw new EventNotEditableException(event.status);
    }
    // Réutilise la validation de la hiérarchie référentielle et des tags de la création.
    const built = await this.buildValidatedEventData(dto, event.source);
    const tagIds =
      (built.tags?.create as { tagId: string }[] | undefined)?.map((tag) => tag.tagId) ?? [];
    const subjectIds =
      (built.subjects?.create as { subjectId: string }[] | undefined)?.map(
        (link) => link.subjectId,
      ) ?? [];
    const modalityIds =
      (built.modalities?.create as { modalityId: string }[] | undefined)?.map(
        (link) => link.modalityId,
      ) ?? [];
    // Ne met à jour que les champs éditables : source, statut et créateur restent inchangés.
    // Les relations transverses (sujets, modalités, tags) sont remplacées intégralement.
    const data: Prisma.EventUncheckedUpdateInput = {
      activityId: built.activityId,
      eventTypeId: built.eventTypeId,
      organizerId: built.organizerId,
      venueId: built.venueId,
      municipalityId: built.municipalityId,
      title: built.title,
      description: built.description,
      startsAt: built.startsAt,
      endsAt: built.endsAt,
      price: built.price,
      currency: built.currency,
    };
    return this.repository.updateWithRefs(id, data, { tagIds, subjectIds, modalityIds });
  }

  /**
   * Détecte un doublon au catalogue public (FSPEC.22 §13) : événement public identique par titre et
   * date de début. Déterministe ; sert de contrôle automatique avant validation.
   */
  hasPublicDuplicate(title: string, startsAt: Date): Promise<boolean> {
    return this.repository.publicDuplicateExists(title, startsAt);
  }

  /**
   * Valide la cohérence hiérarchique (FSPEC.03 RM-002..005) et construit les données
   * d'Event sans écrire. Le Domain est déduit de l'Activity côté persistance.
   */
  async buildValidatedEventData(
    dto: CreateEventDto,
    source: EventSource,
  ): Promise<Prisma.EventUncheckedCreateInput> {
    const activity = await this.activityRepository.findById(dto.activityId);
    if (!activity) {
      throw new ActivityNotFoundException(dto.activityId);
    }
    // Type transverse (DATA.01 v2.0) : existence seule, aucun rattachement à l'Activité.
    if (dto.eventTypeId && !(await this.eventTypeRepository.findById(dto.eventTypeId))) {
      throw new InvalidEventTypeException(dto.eventTypeId);
    }
    if (dto.organizerId && !(await this.organizerRepository.findById(dto.organizerId))) {
      throw new OrganizerNotFoundException(dto.organizerId);
    }
    if (dto.venueId && !(await this.venueRepository.findById(dto.venueId))) {
      throw new VenueNotFoundException(dto.venueId);
    }
    if (dto.municipalityId && !(await this.municipalityRepository.findById(dto.municipalityId))) {
      throw new MunicipalityNotFoundException(dto.municipalityId);
    }
    const tagIds = await this.validateTags(dto.tagIds);
    const subjectIds = await this.validateSubjects(dto.subjectIds);
    const modalityIds = await this.validateModalities(dto.modalityIds);

    return {
      source,
      activityId: dto.activityId,
      eventTypeId: dto.eventTypeId ?? null,
      organizerId: dto.organizerId ?? null,
      venueId: dto.venueId ?? null,
      municipalityId: dto.municipalityId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt ?? null,
      price: dto.price ?? null,
      currency: dto.currency ?? null,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      subjects: subjectIds.length
        ? { create: subjectIds.map((subjectId) => ({ subjectId })) }
        : undefined,
      modalities: modalityIds.length
        ? { create: modalityIds.map((modalityId) => ({ modalityId })) }
        : undefined,
    };
  }

  /** Vérifie que tous les tags existent ; renvoie la liste dédoublonnée. */
  private async validateTags(tagIds: string[] | undefined): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }
    const unique = [...new Set(tagIds)];
    const existing = await this.tagRepository.findExistingIds(unique);
    const missing = unique.filter((id) => !existing.includes(id));
    if (missing.length > 0) {
      throw new InvalidTagsException(missing);
    }
    return unique;
  }

  /** Vérifie l'existence de chaque Subject (Axe A) ; renvoie la liste dédoublonnée. */
  private async validateSubjects(ids: string[] | undefined): Promise<string[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const unique = [...new Set(ids)];
    for (const id of unique) {
      if (!(await this.subjectRepository.findById(id))) {
        throw new SubjectNotFoundException(id);
      }
    }
    return unique;
  }

  /** Vérifie l'existence de chaque Modality (Axe C) ; renvoie la liste dédoublonnée. */
  private async validateModalities(ids: string[] | undefined): Promise<string[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const unique = [...new Set(ids)];
    for (const id of unique) {
      if (!(await this.modalityRepository.findById(id))) {
        throw new ModalityNotFoundException(id);
      }
    }
    return unique;
  }
}
