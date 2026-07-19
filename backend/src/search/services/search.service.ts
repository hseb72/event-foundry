import { Injectable } from '@nestjs/common';
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { EventMapper } from '../../events/mappers/event.mapper';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchFacetsDto, SearchResultsDto } from '../dto/search-results.dto';
import { SearchFilter, SearchRepository } from '../repositories/search.repository';

/**
 * Interrogation du domaine Search (TSPEC.09) : recherche plein texte, filtres, tri, pagination et
 * facettes contextuelles. Search classe des identifiants d'événements dans son index puis
 * réhydrate les données auprès du Catalog (qui reste propriétaire). Aucune décision métier.
 */
@Injectable()
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  async search(userId: string, query: SearchQueryDto): Promise<SearchResultsDto> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;
    const filter = this.toFilter(query, skip, take);

    const { ids, total } = await this.repository.query(filter);
    const events = await this.repository.hydrate(ids, userId);
    const byId = new Map(events.map((event) => [event.id, event]));

    // Préserve l'ordre de pertinence renvoyé par l'index.
    const items: EventResponseDto[] = ids
      .map((id) => byId.get(id))
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .map((event) => EventMapper.toResponse(event, event.participations[0] ?? null));

    return { items, total, skip, take };
  }

  async facets(query: SearchQueryDto): Promise<SearchFacetsDto> {
    const filter = this.toFilter(query, 0, 0);
    return this.repository.facets(filter);
  }

  private toFilter(query: SearchQueryDto, skip: number, take: number): SearchFilter {
    return {
      text: query.q || undefined,
      activityId: query.activityId,
      categoryId: query.categoryId,
      municipalityId: query.municipalityId,
      tagId: query.tagId,
      startsFrom: query.from ? new Date(query.from) : undefined,
      startsTo: query.to ? new Date(query.to) : undefined,
      sort: query.sort ?? 'relevance',
      skip,
      take,
    };
  }
}
