import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EventsApi } from '../../core/api/events.service';
import { PlanningEntry } from '../../core/models';
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
      .banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(249, 115, 22, 0.12);
        color: #9a3412;
        border: 1px solid rgba(249, 115, 22, 0.35);
        border-radius: 10px;
        padding: 0.6rem 0.9rem;
        margin: 0.75rem 0 1.25rem;
        font-size: 0.9rem;
      }
      .entry.conflict {
        border-left: 4px solid var(--orange);
        padding-left: 0.75rem;
        border-radius: 4px;
      }
      .conflict-tag {
        display: inline-block;
        margin: 0.15rem 0 0.4rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: #9a3412;
        background: rgba(249, 115, 22, 0.14);
        border-radius: 999px;
        padding: 0.1rem 0.55rem;
      }
    `,
  ],
  template: `
    <h1>Mon planning</h1>
    <p class="muted">Les événements auxquels vous participez.</p>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else if (!entries().length) {
      <p class="empty">
        Aucun événement dans votre planning. Déclarez votre intérêt depuis « Découvrir ».
      </p>
    } @else {
      @if (conflictCount() > 0) {
        <div class="banner">
          ⚠️ {{ conflictCount() }} conflit(s) d'horaire détecté(s) dans votre planning.
        </div>
      }
      <div class="results">
        @for (entry of entries(); track entry.event.id) {
          <div class="entry" [class.conflict]="entry.conflictsWith.length">
            @if (entry.conflictsWith.length) {
              <span class="conflict-tag">Conflit d'horaire</span>
            }
            <app-event-card [event]="entry.event" />
          </div>
        }
      </div>
    }
  `,
})
export class CalendarComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);

  readonly entries = signal<PlanningEntry[]>([]);
  readonly loading = signal(true);
  readonly conflictCount = computed(
    () => this.entries().filter((entry) => entry.conflictsWith.length > 0).length,
  );

  ngOnInit(): void {
    this.eventsApi.planning().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
