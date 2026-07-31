import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { FacetsDto } from '../dto/facets.dto';
import { DiscoveryService } from '../services/discovery.service';

/**
 * Découverte (TSPEC.04) : navigation à facettes et « Surprends-moi ». Lecture seule, réservée à
 * la permission `catalog.read`. La recherche filtrée/triée passe par `GET /events`.
 */
@ApiTags('discovery')
@ApiBearerAuth()
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('facets')
  @RequirePermissions('catalog.read')
  @ApiOkResponse({ type: FacetsDto })
  facets(): Promise<FacetsDto> {
    return this.discovery.facets();
  }

  @Get('surprise')
  @RequirePermissions('catalog.read')
  @ApiOkResponse({ type: [EventResponseDto] })
  surprise(
    @CurrentUser() user: AuthenticatedUser,
    @Query('take', new DefaultValuePipe(6), ParseIntPipe) take: number,
  ): Promise<EventResponseDto[]> {
    return this.discovery.surprise(user.userId, Math.min(Math.max(take, 1), 20));
  }
}
