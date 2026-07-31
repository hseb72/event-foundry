import { Module } from '@nestjs/common';
import { DiscoveryController } from './controllers/discovery.controller';
import { DiscoveryRepository } from './repositories/discovery.repository';
import { DiscoveryService } from './services/discovery.service';
import { EventCoversModule } from '../event-covers/event-covers.module';

/**
 * Domaine Discovery (TSPEC.04) : orchestration de l'exploration (facettes, « Surprends-moi »).
 * Lecture seule sur le Catalog ; aucune donnée propre.
 */
@Module({
  imports: [EventCoversModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryRepository],
})
export class DiscoveryModule {}
