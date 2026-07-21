import {
  Body,
  Controller,
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
import { EventCandidateStatus } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CreateEventDto } from '../../events/dto/create-event.dto';
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { EventMapper } from '../../events/mappers/event.mapper';
import {
  EventCandidateDetailResponseDto,
  EventCandidateResponseDto,
} from '../dto/event-candidate-response.dto';
import { UpdateEventCandidateDto } from '../dto/update-event-candidate.dto';
import { EventCandidateMapper } from '../mappers/event-candidate.mapper';
import { EventCandidatesService } from '../services/event-candidates.service';

const MAX_PAGE_SIZE = 100;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

@ApiTags('event-candidates')
@ApiBearerAuth()
@Controller()
export class EventCandidatesController {
  constructor(private readonly service: EventCandidatesService) {}

  @Get('event-candidates')
  async list(
    @Query('status') status?: EventCandidateStatus,
    @Query('importJobId') importJobId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<EventCandidateResponseDto[]> {
    const candidates = await this.service.list({
      status,
      importJobId,
      skip: parseIntOrDefault(skip, 0),
      take: Math.min(parseIntOrDefault(take, 20) || 20, MAX_PAGE_SIZE),
    });
    return candidates.map(EventCandidateMapper.toResponse);
  }

  @Get('imports/:importJobId/event-candidates')
  async listByImport(
    @Param('importJobId', ParseUUIDPipe) importJobId: string,
  ): Promise<EventCandidateResponseDto[]> {
    const candidates = await this.service.listByImportJob(importJobId);
    return candidates.map(EventCandidateMapper.toResponse);
  }

  @Get('event-candidates/:id')
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventCandidateDetailResponseDto> {
    return EventCandidateMapper.toDetail(await this.service.getDetail(id));
  }

  @Put('event-candidates/:id')
  async correct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventCandidateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventCandidateResponseDto> {
    return EventCandidateMapper.toResponse(await this.service.correct(id, dto, user.userId));
  }

  @Post('event-candidates/:id/validate')
  @HttpCode(HttpStatus.CREATED)
  async validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.service.validate(id, dto, user.userId));
  }

  @Post('event-candidates/:id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EventCandidateResponseDto> {
    return EventCandidateMapper.toResponse(await this.service.reject(id));
  }
}
