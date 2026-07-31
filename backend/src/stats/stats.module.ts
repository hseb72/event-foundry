import { Module } from '@nestjs/common';
import { StatsController } from './controllers/stats.controller';
import { ImportStatsRepository } from './repositories/import-stats.repository';
import { StatsService } from './services/stats.service';

/** Statistiques du pipeline d'import pour l'administration (EPIC 11, exploite import_job_events). */
@Module({
  controllers: [StatsController],
  providers: [StatsService, ImportStatsRepository],
})
export class StatsModule {}
