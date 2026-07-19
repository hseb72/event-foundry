import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SearchQueryDto } from '../dto/search-query.dto';
import { ReindexResultDto, SearchFacetsDto, SearchResultsDto } from '../dto/search-results.dto';
import { SearchIndexService } from '../services/search-index.service';
import { SearchService } from '../services/search.service';

/**
 * API du domaine Search (TSPEC.09) : recherche plein texte sur l'index des événements publiés,
 * facettes contextuelles et reconstruction de l'index. La lecture est ouverte à `catalog.read` ;
 * la reconstruction est réservée à la supervision technique (`pipeline.manage`).
 */
@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly index: SearchIndexService,
  ) {}

  @Get('events')
  @RequirePermissions('catalog.read')
  @ApiOkResponse({ type: SearchResultsDto })
  searchEvents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResultsDto> {
    return this.search.search(user.userId, query);
  }

  @Get('facets')
  @RequirePermissions('catalog.read')
  @ApiOkResponse({ type: SearchFacetsDto })
  facets(@Query() query: SearchQueryDto): Promise<SearchFacetsDto> {
    return this.search.facets(query);
  }

  @Post('reindex')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('pipeline.manage')
  @ApiOkResponse({ type: ReindexResultDto })
  async reindex(): Promise<ReindexResultDto> {
    const indexed = await this.index.rebuild();
    return { indexed };
  }
}
