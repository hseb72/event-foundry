import { Module } from '@nestjs/common';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { CasesController } from './cases.controller';
import { CasesRepository } from './cases.repository';
import { CasesService } from './cases.service';
import { ReferenceSuggestionService } from './reference-suggestion.service';

/**
 * Case Management (FSPEC.21) : point d'entrée unique des demandes adressées aux Operators. Exporte
 * `CasesService` pour que d'autres domaines (import, RGPD, modération, IA) ouvrent des Cases.
 *
 * Dépend de `ReferenceDataModule` pour matérialiser une **proposition d'ajout au référentiel**
 * acceptée par la modération : la création reste faite par le domaine propriétaire du référentiel,
 * jamais par une écriture directe depuis les Cases.
 */
@Module({
  imports: [ReferenceDataModule],
  controllers: [CasesController],
  providers: [CasesService, CasesRepository, ReferenceSuggestionService],
  exports: [CasesService],
})
export class CasesModule {}
