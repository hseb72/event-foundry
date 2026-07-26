import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { SearchModule } from '../search/search.module';
import { ModerationController } from './moderation.controller';
import { ModerationRepository } from './moderation.repository';
import { ModerationService } from './moderation.service';

/**
 * Platform Moderation (FSPEC.20). S'appuie sur les Cases (signalements → file Moderation) et sur
 * l'index de recherche (retrait des contenus masqués). Applique et historise les décisions.
 */
@Module({
  imports: [CasesModule, SearchModule],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService],
})
export class ModerationModule {}
