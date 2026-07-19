import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventsApi } from '../../core/api/events.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ActivityDto, EventDto, ReferentialItem } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [FormsModule, EventCardComponent],
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
      <select class="select" [(ngModel)]="categoryId">
        <option value="">Toutes les catégories</option>
        @for (category of categories; track category.id) {
          <option [value]="category.id">{{ category.name }}</option>
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
      <button class="btn btn-primary" (click)="search()">Rechercher</button>
    </div>

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
  categories: ReferentialItem[] = [];
  tags: ReferentialItem[] = [];
  events: EventDto[] = [];
  q = '';
  activityId = '';
  categoryId = '';
  tagId = '';
  period = '';
  participation = '';
  loading = false;

  constructor(
    private readonly eventsApi: EventsApi,
    private readonly referenceDataApi: ReferenceDataApi,
  ) {}

  ngOnInit(): void {
    this.referenceDataApi.activities().subscribe((activities) => (this.activities = activities));
    this.referenceDataApi.categories().subscribe((categories) => (this.categories = categories));
    this.referenceDataApi.tags().subscribe((tags) => (this.tags = tags));
    this.search();
  }

  search(): void {
    const params: Record<string, string> = {};
    if (this.q) params['q'] = this.q;
    if (this.activityId) params['activityId'] = this.activityId;
    if (this.categoryId) params['categoryId'] = this.categoryId;
    if (this.tagId) params['tagId'] = this.tagId;
    if (this.period) params['period'] = this.period;
    if (this.participation) params['participation'] = this.participation;

    this.loading = true;
    this.eventsApi.search(params).subscribe({
      next: (result) => {
        this.events = result.items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
