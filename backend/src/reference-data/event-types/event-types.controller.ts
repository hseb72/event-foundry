import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CreateEventTypeDto, EventTypeResponseDto, UpdateEventTypeDto } from './event-type.dto';
import { EventTypeMapper } from './event-type.mapper';
import { EventTypesService } from './event-types.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('event-types')
export class EventTypesController {
  constructor(private readonly service: EventTypesService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('activityId') activityId?: string,
  ): Promise<EventTypeResponseDto[]> {
    const eventTypes = await this.service.list(includeInactive === 'true', activityId);
    return eventTypes.map(EventTypeMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateEventTypeDto): Promise<EventTypeResponseDto> {
    return EventTypeMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    return EventTypeMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<EventTypeResponseDto> {
    return EventTypeMapper.toResponse(await this.service.deactivate(id));
  }
}
