import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CreateEventDto } from '../dto/create-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventStatusEventDto } from '../dto/event-status-event.dto';
import { PaginatedEventsResponseDto } from '../dto/paginated-events-response.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import { EventMapper } from '../mappers/event.mapper';
import { EventMediaService } from '../services/event-media.service';
import { EventsService } from '../services/events.service';
import { PublishingService } from '../services/publishing.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly mediaService: EventMediaService,
    private readonly publishing: PublishingService,
  ) {}

  /** Recherche / catalogue (FSPEC.04). L'état de participation de l'utilisateur est inclus. */
  @Get()
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchEventsQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    const { items, total, skip, take } = await this.service.search(user.userId, query);
    return {
      items: items.map((event) => EventMapper.toResponse(event, event.participations[0] ?? null)),
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
    return EventMapper.toResponse(await this.service.createManual(dto, user.userId));
  }

  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    const dto = EventMapper.toResponse(await this.service.getOrThrow(id));
    dto.media = await this.mediaService.listWithUrls(id);
    return dto;
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
