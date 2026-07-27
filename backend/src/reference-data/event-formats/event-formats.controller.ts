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
  ): Promise<EventFormatResponseDto[]> {
    const eventFormats = await this.service.list(includeInactive === 'true');
    return eventFormats.map(EventFormatMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateEventFormatDto): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventFormatDto,
  ): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<EventFormatResponseDto> {
    return EventFormatMapper.toResponse(await this.service.deactivate(id));
  }
}
