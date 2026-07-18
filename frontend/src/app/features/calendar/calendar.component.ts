import { Component, OnInit } from '@angular/core';
import { EventsApi } from '../../core/api/events.service';
import { EventDto } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [EventCardComponent],
  styles: [
    `
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
    <h1>Mon planning</h1>
    <p class="muted">Les événements auxquels vous participez.</p>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (events.length === 0) {
      <p class="empty">
        Aucun événement dans votre calendrier. Déclarez votre intérêt depuis « Découvrir ».
      </p>
    } @else {
      <div class="results">
        @for (event of events; track event.id) {
          <app-event-card [event]="event" />
        }
      </div>
    }
  `,
})
export class CalendarComponent implements OnInit {
  events: EventDto[] = [];
  loading = false;

  constructor(private readonly eventsApi: EventsApi) {}

  ngOnInit(): void {
    this.loading = true;
    this.eventsApi.calendar({}).subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
