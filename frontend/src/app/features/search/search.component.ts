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
  styles: [
    `
      .searchbar {
        display: flex;
        gap: 0.6rem;
        margin: 1rem 0 1.25rem;
      }
      .searchbar .input {
        flex: 1 1 auto;
        font-size: 1.05rem;
        padding: 0.7rem 0.9rem;
      }
      .searchbar .select {
        flex: 0 0 200px;
      }
      .facet-group {
        margin-bottom: 0.9rem;
      }
      .facet-group h3 {
        margin: 0 0 0.4rem;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.82rem;
        cursor: pointer;
      }
      .chip.on {
        background: var(--exp);
        border-color: var(--exp);
        color: #fff;
      }
      .chip .n {
        opacity: 0.6;
        font-weight: 700;
        margin-left: 0.3rem;
      }
      .summary {
        color: var(--muted);
        margin: 1rem 0 0.75rem;
        font-size: 0.9rem;
      }
      .results {
        display: grid;
        gap: 0.9rem;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
      .reset {
        background: transparent;
        border: 0;
        color: var(--exp);
        cursor: pointer;
        font-size: 0.82rem;
        padding: 0;
      }
    `,
  ],
  template: `
    <h1>Rechercher</h1>
    <p class="muted">Recherche plein texte sur les événements publiés, classée par pertinence.</p>

    <div class="searchbar">
      <input
        class="input"
        placeholder="Titre, activité, organisateur, lieu…"
        [(ngModel)]="q"
        (keyup.enter)="runSearch()"
      />
      <select class="select" [(ngModel)]="sort" (change)="runSearch()">
        <option value="relevance">Pertinence</option>
        <option value="upcoming">À venir</option>
        <option value="newest">Nouveautés</option>
        <option value="title">A → Z</option>
      </select>
      <button class="btn btn-primary" (click)="runSearch()">Rechercher</button>
    </div>

    @if (facets) {
      @if (hasAnyFacet()) {
        <div class="facets">
          @if (facets.activities.length) {
            <div class="facet-group">
              <h3>Activités</h3>
              <div class="chips">
                @for (f of facets.activities; track f.id) {
                  <button class="chip" [class.on]="activityId === f.id" (click)="toggle('activityId', f.id)">
                    {{ f.name }}<span class="n">{{ f.count }}</span>
                  </button>
                }
              </div>
            </div>
          }
          @if (facets.subjects.length) {
            <div class="facet-group">
              <h3>Sujets</h3>
              <div class="chips">
                @for (f of facets.subjects; track f.id) {
                  <button class="chip" [class.on]="subjectId === f.id" (click)="toggle('subjectId', f.id)">
                    {{ f.name }}<span class="n">{{ f.count }}</span>
                  </button>
                }
              </div>
            </div>
          }
          @if (facets.municipalities.length) {
            <div class="facet-group">
              <h3>Communes</h3>
              <div class="chips">
                @for (f of facets.municipalities; track f.id) {
                  <button class="chip" [class.on]="municipalityId === f.id" (click)="toggle('municipalityId', f.id)">
                    {{ f.name }}<span class="n">{{ f.count }}</span>
                  </button>
                }
              </div>
            </div>
          }
          @if (facets.tags.length) {
            <div class="facet-group">
              <h3>Tags</h3>
              <div class="chips">
                @for (f of facets.tags; track f.id) {
                  <button class="chip" [class.on]="tagId === f.id" (click)="toggle('tagId', f.id)">
                    {{ f.name }}<span class="n">{{ f.count }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    }

    @if (!loading) {
      <p class="summary">
        {{ total }} résultat{{ total > 1 ? 's' : '' }}
        @if (hasFilters()) {
          · <button class="reset" (click)="reset()">Réinitialiser les filtres</button>
        }
      </p>
    }

    @if (loading) {
      <p class="muted">Recherche…</p>
    } @else if (results.length === 0) {
      <p class="empty">Aucun événement ne correspond à cette recherche.</p>
    } @else {
      <div class="results">
        @for (event of results; track event.id) {
          <app-event-card [event]="event" />
        }
      </div>
    }
  `,
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
