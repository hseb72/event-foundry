import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ImportStatsResponseDto } from '../dto/import-stats-response.dto';
import { StatsService } from '../services/stats.service';

@ApiTags('admin-stats')
@ApiBearerAuth()
@Controller('admin')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  /** Tableau de bord du pipeline d'import (réservé ADMIN). */
  @Get('import-stats')
  @RequirePermissions('dashboard.view')
  importStats(): Promise<ImportStatsResponseDto> {
    return this.service.importStats();
  }
}
