import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CalendarQueryDto } from '../../events/dto/calendar-query.dto';
import { PlanningEntryDto } from '../dto/planning-entry.dto';
import { PlanningService } from '../services/planning.service';

/**
 * Planning personnel (TSPEC.03) : les événements retenus par l'utilisateur, avec la détection
 * des conflits d'horaire. Réservé à la permission `planning.manage` (rôle Explorer).
 */
@ApiTags('planning')
@ApiBearerAuth()
@Controller('me/planning')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get()
  @RequirePermissions('planning.manage')
  @ApiOkResponse({ type: [PlanningEntryDto] })
  getPlanning(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CalendarQueryDto,
  ): Promise<PlanningEntryDto[]> {
    return this.planning.getPlanning(user.userId, query);
  }
}
