import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateEventDto } from '../dto/create-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import { PaginatedEventsResponseDto } from '../dto/paginated-events-response.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import { EventMapper } from '../mappers/event.mapper';
import { EventsService } from '../services/events.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  /** Recherche / catalogue (FSPEC.04). */
  @Get()
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  async search(@Query() query: SearchEventsQueryDto): Promise<PaginatedEventsResponseDto> {
    const { items, total, skip, take } = await this.service.search(query);
    return { items: items.map(EventMapper.toResponse), total, skip, take };
  }

  /** Création manuelle d'un Event (source = MANUAL). */
  @Post()
  @ApiCreatedResponse({ type: EventResponseDto })
  async create(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.createManual(dto));
  }

  @Get(':id')
  @ApiOkResponse({ type: EventResponseDto })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.getOrThrow(id));
  }
}
