import { Injectable, Logger } from '@nestjs/common';
import { SearchRepository } from '../repositories/search.repository';

/**
 * Cycle de vie de l'index de recherche (TSPEC.09). Réagit aux événements du Catalog :
 * publication → indexation, dépublication / archivage / suppression → retrait. L'index reste une
 * projection reconstructible : `rebuild` le régénère intégralement à partir des événements publiés.
 *
 * L'indexation ne doit jamais faire échouer l'opération métier du Catalog : les erreurs sont
 * journalisées, l'index pouvant toujours être reconstruit.
 */
@Injectable()
export class SearchIndexService {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(private readonly repository: SearchRepository) {}

  /** Indexe (ou réindexe) un événement devenu / resté publié. */
  async index(eventId: string): Promise<void> {
    try {
      const documents = await this.repository.loadPublished([eventId]);
      if (documents.length === 0) {
        await this.repository.remove(eventId);
        return;
      }
      await this.repository.upsert(documents);
    } catch (error) {
      this.logger.error(`Indexation de l'événement ${eventId} échouée`, error as Error);
    }
  }

  /** Retire un événement de l'index (dépublication / archivage / suppression). */
  async remove(eventId: string): Promise<void> {
    try {
      await this.repository.remove(eventId);
    } catch (error) {
      this.logger.error(`Retrait de l'événement ${eventId} de l'index échoué`, error as Error);
    }
  }

  /** Reconstruit l'intégralité de l'index à partir du Catalog. Renvoie le nombre de documents. */
  async rebuild(): Promise<number> {
    const documents = await this.repository.loadPublished();
    await this.repository.clear();
    await this.repository.upsert(documents);
    return this.repository.count();
  }
}
