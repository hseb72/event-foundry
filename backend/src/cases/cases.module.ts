import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesRepository } from './cases.repository';
import { CasesService } from './cases.service';

/**
 * Case Management (FSPEC.21) : point d'entrée unique des demandes adressées aux Operators. Exporte
 * `CasesService` pour que d'autres domaines (import, RGPD, modération, IA) ouvrent des Cases.
 */
@Module({
  controllers: [CasesController],
  providers: [CasesService, CasesRepository],
  exports: [CasesService],
})
export class CasesModule {}
