import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOkResponse } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ImportStatsResponseDto } from '../dto/import-stats-response.dto';
import { PlatformOverviewDto } from '../dto/platform-overview-response.dto';
import { StatsService } from '../services/stats.service';

@ApiTags('admin-stats')
@ApiBearerAuth()
@Controller('admin')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  /** Vision globale de l'état de la plateforme (tableau de bord Operator — OPE-001). */
  @Get('overview')
  @RequirePermissions('dashboard.view')
  @ApiOkResponse({ type: PlatformOverviewDto })
  overview(): Promise<PlatformOverviewDto> {
    return this.service.platformOverview();
  }

  /** Tableau de bord du pipeline d'import (réservé ADMIN). */
  @Get('import-stats')
  @RequirePermissions('dashboard.view')
  importStats(): Promise<ImportStatsResponseDto> {
    return this.service.importStats();
  }
}
