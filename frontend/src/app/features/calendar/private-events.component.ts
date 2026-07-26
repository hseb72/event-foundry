import { Component, inject, OnInit, signal } from '@angular/core';
import { EventsApi } from '../../core/api/events.service';
import { EventDto } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

/**
 * Mes événements privés (FSPEC.22 §15) : les événements personnels issus d'une validation Explorer.
 * Ils ne sont **pas publiés** au catalogue et ne sont visibles que de leur créateur. L'Explorer peut
 * néanmoins les qualifier immédiatement (intérêt, réservation, paiement, ajout au planning).
 */
@Component({
  selector: 'app-private-events',
  standalone: true,
  imports: [EventCardComponent],
  styles: [
    `
      .note {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--exp-weak, rgba(37, 99, 235, 0.1));
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.6rem 0.9rem;
        margin: 0 0 1.25rem;
        font-size: 0.9rem;
        color: var(--text);
      }
      .results {
        display: grid;
        gap: 0.9rem;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
    `,
  ],
  template: `
    <h1>Mes événements privés</h1>
    <p class="muted">Vos événements personnels, visibles de vous seul et non publiés au catalogue.</p>

    <div class="note">
      🔒 Ces événements restent privés. Vous pouvez les ajouter à votre planning, indiquer votre
      intérêt, une réservation ou un paiement — sans qu'ils soient diffusés à d'autres utilisateurs.
    </div>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else if (!events().length) {
      <p class="empty">
        Vous n'avez pas encore d'événement privé. Lorsque vous validez un événement importé sans le
        publier, il apparaît ici.
      </p>
    } @else {
      <div class="results">
        @for (event of events(); track event.id) {
          <app-event-card [event]="event" />
        }
      </div>
    }
  `,
})
export class PrivateEventsComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);

  readonly events = signal<EventDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.eventsApi.myPrivateEvents().subscribe({
      next: (page) => {
        this.events.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
