import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { SearchModule } from '../search/search.module';
import { ModerationController } from './moderation.controller';
import { ModerationRepository } from './moderation.repository';
import { ModerationService } from './moderation.service';
import { ModerationTermsController } from './moderation-terms.controller';
import { ModerationTermsRepository } from './moderation-terms.repository';
import { ModerationTermsService } from './moderation-terms.service';

/**
 * Platform Moderation (FSPEC.20). S'appuie sur les Cases (signalements → file Moderation) et sur
 * l'index de recherche (retrait des contenus masqués). Applique et historise les décisions. Expose
 * aussi le référentiel des termes de modération (FSPEC.22 §13), consommé par les contrôles de
 * soumission.
 */
@Module({
  imports: [CasesModule, SearchModule],
  controllers: [ModerationController, ModerationTermsController],
  providers: [ModerationService, ModerationRepository, ModerationTermsService, ModerationTermsRepository],
  exports: [ModerationService, ModerationTermsService],
})
export class ModerationModule {}
