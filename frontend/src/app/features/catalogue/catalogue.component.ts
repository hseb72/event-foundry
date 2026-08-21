import { Component, OnInit, inject } from '@angular/core';
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
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css',
})
export class CatalogueComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);
  private readonly referenceDataApi = inject(ReferenceDataApi);
  private readonly discoveryApi = inject(DiscoveryApi);

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
