import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../users/constants/role.constants';
import { ImportStatsResponseDto } from '../dto/import-stats-response.dto';
import { StatsService } from '../services/stats.service';

@ApiTags('admin-stats')
@ApiBearerAuth()
@Controller('admin')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  /** Tableau de bord du pipeline d'import (réservé ADMIN). */
  @Get('import-stats')
  @Roles(SystemRole.ADMIN)
  importStats(): Promise<ImportStatsResponseDto> {
    return this.service.importStats();
  }
}
