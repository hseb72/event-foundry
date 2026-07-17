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
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../users/constants/role.constants';
import {
  CreateEventFormatDto,
  EventFormatResponseDto,
  UpdateEventFormatDto,
} from './event-format.dto';
import { EventFormatMapper } from './event-format.mapper';
import { EventFormatsService } from './event-formats.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('event-formats')
export class EventFormatsController {
  constructor(private readonly service: EventFormatsService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('activityId') activityId?: string,
  ): Promise<EventFormatResponseDto[]> {
    const eventFormats = await this.service.list(includeInactive === 'true', activityId);
    return eventFormats.map(EventFormatMapper.toResponse);
  }

  @Post()
  @Roles(SystemRole.ADMIN)
  async create(@Body() dto: CreateEventFormatDto): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @Roles(SystemRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventFormatDto,
  ): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.deactivate(id));
  }
}
