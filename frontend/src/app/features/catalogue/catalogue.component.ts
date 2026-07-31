import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiscoveryApi } from '../../core/api/discovery.service';
import { EventsApi } from '../../core/api/events.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ActivityDto, EventDto, FacetCount, ReferentialItem } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';
import { FollowButtonComponent } from '../../shared/follow-button.component';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [FormsModule, EventCardComponent, FollowButtonComponent],
  styles: [
    `
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin: 1rem 0 1.5rem;
      }
      .filters > * {
        flex: 1 1 160px;
      }
      .results {
        display: grid;
        gap: 0.9rem;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
      .facets {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1.25rem;
      }
      .facet-wrap {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }
      .facet {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.82rem;
        cursor: pointer;
      }
      .facet.on {
        background: var(--exp);
        border-color: var(--exp);
        color: #fff;
      }
      .facet .n {
        opacity: 0.6;
        font-weight: 700;
        margin-left: 0.25rem;
      }
    `,
  ],
  template: `
    <h1>Découvrir</h1>
    <p class="muted">Trouvez les événements autour de vos activités.</p>

    <div class="filters">
      <input class="input" placeholder="Rechercher…" [(ngModel)]="q" (keyup.enter)="search()" />
      <select class="select" [(ngModel)]="activityId">
        <option value="">Toutes les activités</option>
        @for (activity of activities; track activity.id) {
          <option [value]="activity.id">{{ activity.name }}</option>
        }
      </select>
      <select class="select" [(ngModel)]="subjectId">
        <option value="">Tous les sujets</option>
        @for (subject of subjects; track subject.id) {
          <option [value]="subject.id">{{ subject.name }}</option>
        }
      </select>
      <select class="select" [(ngModel)]="tagId">
        <option value="">Tous les tags</option>
        @for (tag of tags; track tag.id) {
          <option [value]="tag.id">{{ tag.name }}</option>
        }
      </select>
      <select class="select" [(ngModel)]="period">
        <option value="">Toutes les dates</option>
        <option value="today">Aujourd'hui</option>
        <option value="this-week">Cette semaine</option>
        <option value="this-month">Ce mois</option>
        <option value="next-7-days">7 prochains jours</option>
        <option value="next-30-days">30 prochains jours</option>
      </select>
      <select class="select" [(ngModel)]="participation">
        <option value="">Tous les événements</option>
        <option value="mine">Mes événements</option>
        <option value="none">Sans participation</option>
      </select>
      <select class="select" [(ngModel)]="sort">
        <option value="">À venir</option>
        <option value="newest">Nouveautés</option>
        <option value="title">A → Z</option>
      </select>
      <button class="btn btn-primary" (click)="search()">Rechercher</button>
      <button class="btn" (click)="surprise()">🎲 Surprends-moi</button>
    </div>

    @if (subjectFacets.length) {
      <div class="facets">
        @for (facet of subjectFacets; track facet.id) {
          <div class="facet-wrap">
            <button class="facet" [class.on]="subjectId === facet.id" (click)="pickSubject(facet.id)">
              {{ facet.name }}<span class="n">{{ facet.count }}</span>
            </button>
            <app-follow-button targetType="SUBJECT" [targetId]="facet.id" />
          </div>
        }
      </div>
    }

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (events.length === 0) {
      <p class="empty">Aucun événement pour ces critères.</p>
    } @else {
      <div class="results">
        @for (event of events; track event.id) {
          <app-event-card [event]="event" />
        }
      </div>
    }
  `,
})
export class CatalogueComponent implements OnInit {
  activities: ActivityDto[] = [];
  subjects: ReferentialItem[] = [];
  tags: ReferentialItem[] = [];
  subjectFacets: FacetCount[] = [];
  events: EventDto[] = [];
  q = '';
  activityId = '';
  subjectId = '';
  tagId = '';
  period = '';
  participation = '';
  sort = '';
  loading = false;

  constructor(
    private readonly eventsApi: EventsApi,
    private readonly referenceDataApi: ReferenceDataApi,
    private readonly discoveryApi: DiscoveryApi,
  ) {}

  ngOnInit(): void {
    this.referenceDataApi.activities().subscribe((activities) => (this.activities = activities));
    this.referenceDataApi.subjects().subscribe((subjects) => (this.subjects = subjects));
    this.referenceDataApi.tags().subscribe((tags) => (this.tags = tags));
    this.discoveryApi.facets().subscribe((facets) => (this.subjectFacets = facets.subjects));
    this.search();
  }

  search(): void {
    const params: Record<string, string> = {};
    if (this.q) params['q'] = this.q;
    if (this.activityId) params['activityId'] = this.activityId;
    if (this.subjectId) params['subjectId'] = this.subjectId;
    if (this.tagId) params['tagId'] = this.tagId;
    if (this.period) params['period'] = this.period;
    if (this.participation) params['participation'] = this.participation;
    if (this.sort) params['sort'] = this.sort;

    this.loading = true;
    this.eventsApi.search(params).subscribe({
      next: (result) => {
        this.events = result.items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  /** Bascule la catégorie sélectionnée depuis une facette et relance la recherche. */
  pickSubject(id: string): void {
    this.subjectId = this.subjectId === id ? '' : id;
    this.search();
  }

  /** « Surprends-moi » : remplace les résultats par une sélection aléatoire. */
  surprise(): void {
    this.loading = true;
    this.discoveryApi.surprise(6).subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
