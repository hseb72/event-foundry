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
import { PaginatedEventsResponseDto } from '../dto/paginated-events-response.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import { EventMapper } from '../mappers/event.mapper';
import { EventMediaService } from '../services/event-media.service';
import { EventsService } from '../services/events.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(
    private readonly service: EventsService,
    private readonly mediaService: EventMediaService,
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

  /** Création manuelle d'un Event (source = MANUAL). Réservé à `event.create` (Organizer). */
  @Post()
  @RequirePermissions('event.create')
  @ApiCreatedResponse({ type: EventResponseDto })
  async create(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.createManual(dto));
  }

  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    const dto = EventMapper.toResponse(await this.service.getOrThrow(id));
    dto.media = await this.mediaService.listWithUrls(id);
    return dto;
  }

  /** Archive un Event (retiré du catalogue actif). Réservé à `event.archive`. */
  @Post(':id/archive')
  @RequirePermissions('event.archive')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.archive(id));
  }

  /** Restaure un Event archivé (de nouveau publié). Réservé à `event.publish`. */
  @Post(':id/restore')
  @RequirePermissions('event.publish')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: EventResponseDto })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.restore(id));
  }
}
