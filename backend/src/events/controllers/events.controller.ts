import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventEditDto } from '../dto/event-edit.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventStatusEventDto } from '../dto/event-status-event.dto';
import { PaginatedEventsResponseDto } from '../dto/paginated-events-response.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import { EventMapper } from '../mappers/event.mapper';
import { EventMediaService } from '../services/event-media.service';
import { EventsService } from '../services/events.service';
import { OrganizerNotifyService } from '../services/organizer-notify.service';
import { PublishingService } from '../services/publishing.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly mediaService: EventMediaService,
    private readonly publishing: PublishingService,
    private readonly organizerNotify: OrganizerNotifyService,
  ) {}

  /** Recherche / catalogue (FSPEC.04). L'état de participation de l'utilisateur est inclus. */
  @Get()
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchEventsQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    const { items, total, skip, take } = await this.service.search(
      user.userId,
      query,
      user.activeOrganizationId,
    );
    // Le pseudo de l'auteur n'est exposé que dans la vue d'organisation (FSPEC.22), jamais en découverte.
    const includeCreator = Boolean(query.organizationScope);
    return {
      items: items.map((event) =>
        EventMapper.toResponse(event, event.participations[0] ?? null, { includeCreator }),
      ),
      total,
      skip,
      take,
    };
  }

  /** Création manuelle d'un Event (brouillon). Réservé à `event.create` (Organizer). */
  @Post()
  @RequirePermissions('event.create')
  @ApiCreatedResponse({ type: EventResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    // L'origine est figée : créé dans le cadre de l'organisation active (ou autonome si aucune).
    return EventMapper.toResponse(
      await this.service.createManual(dto, user.userId, user.activeOrganizationId),
    );
  }

  /**
   * Événements privés de l'utilisateur courant (FSPEC.22 §15) : ses événements personnels, non
   * diffusés au catalogue. Déclaré avant `:id` (segment `me/private` ≠ UUID).
   */
  @Get('me/private')
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  async myPrivateEvents(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedEventsResponseDto> {
    const items = await this.service.listPrivateEvents(user.userId);
    return {
      items: items.map((event) => EventMapper.toResponse(event, event.participations[0] ?? null)),
      total: items.length,
      skip: 0,
      take: items.length,
    };
  }

  /**
   * Création manuelle d'un **événement privé personnel** (Explorer — FSPEC.22 §15). Homogénéise
   * l'entonnoir de soumission Explorer (onglet « Création »). L'événement reste privé, personnel et
   * non publié ; aucun droit `event.create` requis (action self-service sur ses propres données).
   */
  @Post('me/private')
  @ApiCreatedResponse({ type: EventResponseDto })
  async createPrivate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.createPrivateManual(dto, user.userId));
  }

  /** Archive un de mes événements privés (action personnelle — FSPEC.22 §15). */
  @Post('me/private/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async archivePrivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.archivePrivate(id, user.userId));
  }

  /** Restaure un de mes événements privés archivés (→ brouillon). */
  @Post('me/private/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async restorePrivate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.restorePrivate(id, user.userId));
  }

  /** Fiche d'un Event. Un événement privé n'est lisible que par son créateur (FSPEC.22 §15). */
  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    const event = await this.service.getForReader(id, user.userId);
    const dto = EventMapper.toResponse(event);
    dto.media = await this.mediaService.listWithUrls(id);
    // §16 : proposer la notification de l'organisateur uniquement pour un événement privé qui mentionne
    // une fiche organisateur adossée à une organisation enregistrée.
    if (event.visibility === 'PRIVATE') {
      dto.canNotifyOrganizer = (await this.organizerNotify.notifiableOrganization(event.organizerId)) !== null;
    }
    return dto;
  }

  /**
   * Notifie l'organisateur enregistré qu'un événement privé le mentionne (FSPEC.22 §16). Réservé au
   * créateur de l'événement privé ; purement informatif, ne transfère jamais la propriété (ESUB-011).
   */
  @Post(':id/notify-organizer')
  @HttpCode(HttpStatus.OK)
  async notifyOrganizer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ notified: number; organizationName: string }> {
    return this.organizerNotify.notify(id, user.userId);
  }

  /**
   * Vue d'édition d'un Event (référentiels par identifiant) pour préremplir le formulaire de
   * correction. Réservé à `event.update` (Organizer).
   */
  @Get(':id/edit')
  @RequirePermissions('event.update')
  @ApiOkResponse({ type: EventEditDto })
  async forEdit(@Param('id', ParseUUIDPipe) id: string): Promise<EventEditDto> {
    return EventMapper.toEditDto(await this.service.getOrThrow(id));
  }

  /**
   * Corrige un Event éditable (brouillon / soumis) — FSPEC.13. Réservé à `event.update` (Organizer).
   * Permet de rattraper une erreur de saisie sans recréer l'événement.
   */
  @Patch(':id')
  @RequirePermissions('event.update')
  @ApiOkResponse({ type: EventResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.update(id, dto));
  }

  /** Soumet un brouillon à validation (DRAFT → SUBMITTED). Réservé à `event.update`. */
  @Post(':id/submit')
  @RequirePermissions('event.update')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.publishing.submit(id, user.userId));
  }

  /** Publie un Event (règles déterministes vérifiées). Réservé à `event.publish`. */
  @Post(':id/publish')
  @RequirePermissions('event.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.publishing.publish(id, user.userId));
  }

  /** Dépublie un Event (→ brouillon). Réservé à `event.publish`. */
  @Post(':id/unpublish')
  @RequirePermissions('event.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.publishing.unpublish(id, user.userId));
  }

  /** Archive un Event (retiré du catalogue actif). Réservé à `event.archive`. */
  @Post(':id/archive')
  @RequirePermissions('event.archive')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.publishing.archive(id, user.userId));
  }

  /** Restaure un Event archivé (→ brouillon). Réservé à `event.publish`. */
  @Post(':id/restore')
  @RequirePermissions('event.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.publishing.restore(id, user.userId));
  }

  /** Historique des transitions de statut (traçabilité). */
  @Get(':id/history')
  @ApiOkResponse({ type: [EventStatusEventDto] })
  async history(@Param('id', ParseUUIDPipe) id: string): Promise<EventStatusEventDto[]> {
    const events = await this.publishing.history(id);
    return events.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
      occurredAt: event.occurredAt.toISOString(),
    }));
  }
}
