import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchRepository } from './repositories/search.repository';
import { SearchIndexService } from './services/search-index.service';
import { SearchService } from './services/search.service';

/**
 * Domaine Search (TSPEC.09) : service technique de recherche. Maintient un index (`search_documents`)
 * projeté du Catalog et l'interroge (plein texte, filtres, facettes, tri, pagination). Ne porte
 * aucune logique métier et ne dépend d'aucun autre domaine : le Catalog reste propriétaire des
 * données. `SearchIndexService` est exporté pour que le Publishing déclenche l'(dé)indexation.
 */
@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchIndexService, SearchRepository],
  exports: [SearchIndexService],
})
export class SearchModule {}
