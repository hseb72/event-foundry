import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SearchApi } from '../../core/api/search.service';
import { EventDto, Facets } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

type FacetKind = 'activityId' | 'subjectId' | 'municipalityId' | 'tagId';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, EventCardComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  q = '';
  sort = 'relevance';
  activityId = '';
  subjectId = '';
  municipalityId = '';
  tagId = '';
  results: EventDto[] = [];
  facets: Facets | null = null;
  total = 0;
  loading = false;

  constructor(
    private readonly searchApi: SearchApi,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Amorce depuis l'URL (barre de recherche de l'accueil, lien « Tout voir »).
    const params = this.route.snapshot.queryParamMap;
    this.q = params.get('q') ?? '';
    const sort = params.get('sort');
    if (sort === 'relevance' || sort === 'upcoming' || sort === 'newest' || sort === 'title') {
      this.sort = sort;
    }
    this.runSearch();
  }

  runSearch(): void {
    const params: Record<string, string> = { sort: this.sort };
    if (this.q) params['q'] = this.q;
    if (this.activityId) params['activityId'] = this.activityId;
    if (this.subjectId) params['subjectId'] = this.subjectId;
    if (this.municipalityId) params['municipalityId'] = this.municipalityId;
    if (this.tagId) params['tagId'] = this.tagId;

    this.loading = true;
    this.searchApi.events(params).subscribe({
      next: (page) => {
        this.results = page.items;
        this.total = page.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    // Les facettes ne dépendent que du contexte textuel/temporel (pas des sélections catégorielles).
    const facetParams: Record<string, string> = {};
    if (this.q) facetParams['q'] = this.q;
    this.searchApi.facets(facetParams).subscribe((facets) => (this.facets = facets));
  }

  /** Bascule un filtre de facette (sélection unique par dimension) et relance la recherche. */
  toggle(kind: FacetKind, id: string): void {
    this[kind] = this[kind] === id ? '' : id;
    this.runSearch();
  }

  hasFilters(): boolean {
    return Boolean(this.activityId || this.subjectId || this.municipalityId || this.tagId);
  }

  hasAnyFacet(): boolean {
    const f = this.facets;
    return Boolean(
      f && (f.activities.length || f.subjects.length || f.municipalities.length || f.tags.length),
    );
  }

  reset(): void {
    this.activityId = '';
    this.subjectId = '';
    this.municipalityId = '';
    this.tagId = '';
    this.runSearch();
  }
}
