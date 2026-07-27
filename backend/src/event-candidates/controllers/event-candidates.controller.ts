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
import { CandidateActor, EventCandidatesService } from '../services/event-candidates.service';

const MAX_PAGE_SIZE = 100;

function parseIntOrDefault(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 0 ? fallback : parsed;
}

/** Un Operator (droit `validation.review`) qualifie tout candidat ; sinon, seulement les siens. */
function actorOf(user: AuthenticatedUser): CandidateActor {
  return {
    userId: user.userId,
    isOperator: user.permissions.includes('validation.review'),
    activeOrganizationId: user.activeOrganizationId,
  };
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

  /** Mes brouillons (FSPEC.22 §6) : les candidats issus de mes propres soumissions. */
  @Get('me/event-candidates')
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: EventCandidateStatus,
  ): Promise<EventCandidateResponseDto[]> {
    const candidates = await this.service.listMine(user.userId, status);
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventCandidateDetailResponseDto> {
    return EventCandidateMapper.toDetail(await this.service.getDetail(id, actorOf(user)));
  }

  @Put('event-candidates/:id')
  async correct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventCandidateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventCandidateResponseDto> {
    return EventCandidateMapper.toResponse(await this.service.correct(id, dto, actorOf(user)));
  }

  /**
   * Valide un candidate → Event. L'issue dépend du rôle : un valideur habilité à publier (Organizer)
   * obtient un Event public entrant dans le workflow de publication ; sinon (Explorer) l'Event est
   * privé, personnel et non diffusé (FSPEC.22 §15-17). Un utilisateur ne peut valider que ses propres
   * brouillons (les Operators, tout brouillon — garde de propriété §6).
   */
  @Post('event-candidates/:id/validate')
  @HttpCode(HttpStatus.CREATED)
  async validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventResponseDto> {
    const canPublish = user.permissions.includes('event.publish');
    return EventMapper.toResponse(await this.service.validate(id, dto, actorOf(user), canPublish));
  }

  @Post('event-candidates/:id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EventCandidateResponseDto> {
    return EventCandidateMapper.toResponse(await this.service.reject(id, actorOf(user)));
  }
}
