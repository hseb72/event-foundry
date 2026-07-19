import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { EventDto } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

interface StatusTab {
  key: string;
  label: string;
}

const TABS: StatusTab[] = [
  { key: 'DRAFT', label: 'Brouillons' },
  { key: 'SUBMITTED', label: 'En validation' },
  { key: 'PUBLISHED', label: 'Publiés' },
  { key: 'ARCHIVED', label: 'Archivés' },
];

@Component({
  selector: 'app-organizer-events',
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      h1 {
        margin-bottom: 1rem;
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 1rem 0 1.25rem;
      }
      .tab {
        padding: 0.45rem 0.9rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--surface);
        cursor: pointer;
        font-weight: 500;
        display: flex;
        gap: 0.4rem;
        align-items: center;
      }
      .tab.active {
        background: var(--organizer);
        color: #fff;
        border-color: var(--organizer);
      }
      .count {
        font-size: 0.72rem;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 999px;
        padding: 0 0.4rem;
      }
      .tab.active .count {
        background: rgba(255, 255, 255, 0.25);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border);
      }
      .row .title {
        font-weight: 600;
      }
      .row .date {
        color: var(--muted);
        font-size: 0.85rem;
      }
      .row .actions {
        margin-left: auto;
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .btn-sm {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
      }
      .empty {
        color: var(--muted);
        padding: 1.5rem 0;
      }
    `,
  ],
  template: `
    <h1>Mes événements</h1>
    <p class="muted">Gérez le cycle de publication de vos événements.</p>

    <div class="tabs">
      @for (tab of tabs; track tab.key) {
        <button class="tab" [class.active]="active() === tab.key" (click)="active.set(tab.key)">
          {{ tab.label }}
          <span class="count">{{ countFor(tab.key) }}</span>
        </button>
      }
    </div>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else if (!visible().length) {
      <p class="empty">Aucun événement dans cet état.</p>
    } @else {
      @for (event of visible(); track event.id) {
        <div class="row">
          <div>
            <a class="title" [routerLink]="['/events', event.id]">{{ event.title }}</a>
            <div class="date">{{ date(event) }} · {{ event.activity }}</div>
          </div>
          <div class="actions">
            @for (action of actionsFor(event.status); track action.key) {
              <button class="btn btn-sm" (click)="run(event, action.key)">{{ action.label }}</button>
            }
          </div>
        </div>
      }
    }

    @if (error()) {
      <p style="color:var(--red);margin-top:1rem">{{ error() }}</p>
    }
  `,
})
export class OrganizerEventsComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);

  readonly tabs = TABS;
  readonly events = signal<EventDto[]>([]);
  readonly active = signal<string>('DRAFT');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly visible = computed(() => this.events().filter((e) => e.status === this.active()));

  ngOnInit(): void {
    this.reload();
  }

  countFor(status: string): number {
    return this.events().filter((e) => e.status === status).length;
  }

  date(event: EventDto): string {
    return formatDateTime(event.startsAt);
  }

  /** Actions disponibles selon le statut (le Backend reste seul juge des transitions). */
  actionsFor(status: string): { key: string; label: string }[] {
    switch (status) {
      case 'DRAFT':
        return [
          { key: 'submit', label: 'Soumettre' },
          { key: 'publish', label: 'Publier' },
          { key: 'archive', label: 'Archiver' },
        ];
      case 'SUBMITTED':
        return [
          { key: 'publish', label: 'Publier' },
          { key: 'unpublish', label: 'Brouillon' },
          { key: 'archive', label: 'Archiver' },
        ];
      case 'PUBLISHED':
        return [
          { key: 'unpublish', label: 'Dépublier' },
          { key: 'archive', label: 'Archiver' },
        ];
      case 'ARCHIVED':
        return [{ key: 'restore', label: 'Restaurer' }];
      default:
        return [];
    }
  }

  run(event: EventDto, action: string): void {
    this.error.set(null);
    const call =
      action === 'submit'
        ? this.eventsApi.submit(event.id)
        : action === 'publish'
          ? this.eventsApi.publish(event.id)
          : action === 'unpublish'
            ? this.eventsApi.unpublish(event.id)
            : action === 'archive'
              ? this.eventsApi.archive(event.id)
              : this.eventsApi.restore(event.id);
    call.subscribe({
      next: (updated) => {
        this.events.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
        this.active.set(updated.status);
      },
      error: (err: { error?: { message?: string } }) =>
        this.error.set(err.error?.message ?? "L'action a échoué."),
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.eventsApi.search({ createdByMe: 'true', take: '100' }).subscribe({
      next: (result) => {
        this.events.set(result.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
