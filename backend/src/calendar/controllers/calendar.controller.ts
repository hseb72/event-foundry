import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CalendarQueryDto } from '../../events/dto/calendar-query.dto';
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { EventMapper } from '../../events/mappers/event.mapper';
import { EventsService } from '../../events/services/events.service';

@ApiTags('calendar')
@ApiBearerAuth()
@Controller('me')
export class CalendarController {
  constructor(private readonly eventsService: EventsService) {}

  /** Mon calendrier (FSPEC.05) : événements ayant une participation, avec son état. */
  @Get('calendar')
  @ApiOkResponse({ type: [EventResponseDto] })
  async calendar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CalendarQueryDto,
  ): Promise<EventResponseDto[]> {
    const events = await this.eventsService.getCalendar(user.userId, query);
    return events.map((event) =>
      EventMapper.toResponse(event, event.participations[0] ?? null),
    );
  }
}
