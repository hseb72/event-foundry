import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { IdentityService } from '../../core/api/identity.service';
import { EventDto } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

interface StatCard {
  key: string;
  label: string;
  color: string;
}

const STATS: StatCard[] = [
  { key: 'ALL', label: 'Total', color: 'var(--organizer)' },
  { key: 'DRAFT', label: 'Brouillons', color: '#8a7fb0' },
  { key: 'SUBMITTED', label: 'En validation', color: '#e08600' },
  { key: 'PUBLISHED', label: 'Publiés', color: 'var(--green, #2e7d32)' },
  { key: 'ARCHIVED', label: 'Archivés', color: 'var(--muted)' },
];

/**
 * Tableau de bord de l'expérience Organizer (UISPEC.02 ORG-001). Vision synthétique de l'activité :
 * répartition des événements par statut, actions en attente (brouillons à finaliser, soumissions),
 * et accès rapides. Calculé à partir des propres événements de l'organisateur (Catalog, périmètre MVP).
 */
@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      .head {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .head .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.8rem;
        margin-bottom: 1.75rem;
      }
      .card-stat {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        border-top: 4px solid var(--c, var(--organizer));
        background: var(--surface);
      }
      .card-stat .n {
        font-size: 1.8rem;
        font-weight: 800;
        line-height: 1.1;
      }
      .card-stat .l {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }
      @media (max-width: 780px) {
        .columns {
          grid-template-columns: 1fr;
        }
      }
      h2 {
        font-size: 1.1rem;
        margin: 0 0 0.8rem;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0;
        border-bottom: 1px solid var(--border);
      }
      .row .title {
        font-weight: 600;
      }
      .row .date {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.06);
      }
      .row .cta {
        margin-left: auto;
        display: flex;
        gap: 0.4rem;
      }
      .btn-sm {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
      }
      .empty {
        color: var(--muted);
        padding: 1rem 0;
      }
    `,
  ],
  template: `
    <div class="head">
      <div>
        <h1>Tableau de bord</h1>
        <p class="muted" style="margin:0">Bonjour {{ orgName() }} — voici l'activité de vos événements.</p>
      </div>
      <div class="actions">
        <a class="btn btn-primary" routerLink="/organizer/events">Créer / importer un événement</a>
      </div>
    </div>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else {
      <div class="cards">
        @for (stat of statCards; track stat.key) {
          <div class="card-stat" [style.--c]="stat.color">
            <div class="n">{{ count(stat.key) }}</div>
            <div class="l">{{ stat.label }}</div>
          </div>
        }
      </div>

      <div class="columns">
        <div>
          <h2>Actions en attente</h2>
          @if (pending().length === 0) {
            <p class="empty">Rien à traiter. Tout est publié 🎉</p>
          } @else {
            @for (event of pending(); track event.id) {
              <div class="row">
                <div>
                  <div class="title">{{ event.title }}</div>
                  <div class="date">{{ date(event) }} · <span class="badge">{{ statusLabel(event.status) }}</span></div>
                </div>
                <div class="cta">
                  <a class="btn btn-sm" [routerLink]="['/events', event.id, 'edit']">Modifier</a>
                </div>
              </div>
            }
          }
        </div>

        <div>
          <h2>Publiés à venir</h2>
          @if (publishedUpcoming().length === 0) {
            <p class="empty">Aucun événement publié à venir.</p>
          } @else {
            @for (event of publishedUpcoming(); track event.id) {
              <div class="row">
                <div>
                  <a class="title" [routerLink]="['/events', event.id]">{{ event.title }}</a>
                  <div class="date">{{ date(event) }} · {{ event.activity }}</div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <p style="margin-top:1.5rem">
        <a routerLink="/organizer/events">Voir tous mes événements →</a>
      </p>
    }
  `,
})
export class OrganizerDashboardComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);
  private readonly identity = inject(IdentityService);

  readonly statCards = STATS;
  readonly events = signal<EventDto[]>([]);
  readonly loading = signal(true);

  readonly pending = computed(() =>
    this.events()
      .filter((e) => e.status === 'DRAFT' || e.status === 'SUBMITTED')
      .slice(0, 6),
  );

  readonly publishedUpcoming = computed(() => {
    const now = Date.now();
    return this.events()
      .filter((e) => e.status === 'PUBLISHED' && new Date(e.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 6);
  });

  ngOnInit(): void {
    this.eventsApi.search({ createdByMe: 'true', take: '100' }).subscribe({
      next: (page) => {
        this.events.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  orgName(): string {
    const me = this.identity.me();
    const org = me?.organizations.find((o) => o.id === me.activeOrganizationId);
    return org?.name ?? me?.displayName ?? '';
  }

  count(key: string): number {
    if (key === 'ALL') {
      return this.events().length;
    }
    return this.events().filter((e) => e.status === key).length;
  }

  date(event: EventDto): string {
    return formatDateTime(event.startsAt);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'SUBMITTED':
        return 'En validation';
      case 'PUBLISHED':
        return 'Publié';
      case 'ARCHIVED':
        return 'Archivé';
      default:
        return status;
    }
  }
}
