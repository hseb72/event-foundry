import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DiscoveryApi } from '../../core/api/discovery.service';
import { EventsApi } from '../../core/api/events.service';
import { IdentityService } from '../../core/api/identity.service';
import { EventDto, PlanningEntry } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';
import { formatDateTime } from '../../shared/date-format';

/**
 * Accueil de l'expérience Explorer (UISPEC.01 EXP-001). Point d'entrée qui agrège la recherche,
 * les événements à venir, une sélection à découvrir et un aperçu du planning personnel. N'utilise
 * que des capacités du périmètre MVP (Catalog, Discovery, Planning) — ni recommandation ni
 * notifications (hors MVP).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink, EventCardComponent],
  styles: [
    `
      .hero {
        background: linear-gradient(135deg, #2a1b3d 0%, #3d2560 100%);
        color: #fff;
        border-radius: 16px;
        padding: 2rem 1.75rem;
        margin-bottom: 1.75rem;
      }
      .hero h1 {
        margin: 0 0 0.35rem;
        font-size: 1.7rem;
      }
      .hero p {
        margin: 0 0 1.1rem;
        color: #d9d5e6;
      }
      .search {
        display: flex;
        gap: 0.6rem;
        max-width: 620px;
      }
      .search input {
        flex: 1 1 auto;
        font-size: 1.05rem;
        padding: 0.7rem 0.9rem;
        border-radius: 10px;
        border: 0;
      }
      .quick {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .quick a {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        border-radius: 999px;
        padding: 0.35rem 0.9rem;
        font-size: 0.85rem;
        font-weight: 500;
      }
      .quick a:hover {
        background: rgba(255, 255, 255, 0.22);
      }
      section {
        margin-bottom: 2rem;
      }
      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.9rem;
      }
      .section-head h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      .section-head a {
        color: var(--exp);
        font-size: 0.85rem;
        font-weight: 600;
      }
      .grid {
        display: grid;
        gap: 0.9rem;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }
      .planning-list {
        display: grid;
        gap: 0.5rem;
      }
      .planning-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        border-left: 5px solid var(--stripe, var(--exp));
      }
      .planning-row .title {
        font-weight: 600;
      }
      .planning-row .date {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .planning-row .conflict {
        margin-left: auto;
        color: #e08600;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .empty {
        color: var(--muted);
        padding: 0.5rem 0 1rem;
      }
    `,
  ],
  template: `
    <div class="hero">
      <h1>Bonjour{{ firstName() ? ', ' + firstName() : '' }} 👋</h1>
      <p>Trouvez votre prochain événement et organisez votre planning.</p>
      <div class="search">
        <input
          placeholder="Rechercher un événement, une activité, un lieu…"
          [(ngModel)]="q"
          (keyup.enter)="search()"
        />
        <button class="btn btn-primary" (click)="search()">Rechercher</button>
      </div>
      <div class="quick">
        <a routerLink="/discover">Découvrir</a>
        <a routerLink="/search">Recherche avancée</a>
        <a routerLink="/calendar">Mon planning</a>
      </div>
    </div>

    <section>
      <div class="section-head">
        <h2>À venir</h2>
        <a routerLink="/search" [queryParams]="{ sort: 'upcoming' }">Tout voir</a>
      </div>
      @if (loadingUpcoming) {
        <p class="muted">Chargement…</p>
      } @else if (upcoming.length === 0) {
        <p class="empty">Aucun événement à venir pour le moment.</p>
      } @else {
        <div class="grid">
          @for (event of upcoming; track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
      }
    </section>

    <section>
      <div class="section-head">
        <h2>À découvrir</h2>
        <a routerLink="/discover">Explorer le catalogue</a>
      </div>
      @if (loadingDiscover) {
        <p class="muted">Chargement…</p>
      } @else if (discover.length === 0) {
        <p class="empty">Rien à suggérer pour l'instant.</p>
      } @else {
        <div class="grid">
          @for (event of discover; track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
      }
    </section>

    <section>
      <div class="section-head">
        <h2>Mon planning</h2>
        <a routerLink="/calendar">Ouvrir le calendrier</a>
      </div>
      @if (loadingPlanning) {
        <p class="muted">Chargement…</p>
      } @else if (planning.length === 0) {
        <p class="empty">Votre planning est vide. Ajoutez des événements depuis la découverte.</p>
      } @else {
        <div class="planning-list">
          @for (entry of planning; track entry.event.id) {
            <a class="planning-row" [routerLink]="['/events', entry.event.id]">
              <div>
                <div class="title">{{ entry.event.title }}</div>
                <div class="date">{{ date(entry.event) }} · {{ entry.event.activity }}</div>
              </div>
              @if (entry.conflictsWith.length) {
                <span class="conflict">⚠ Conflit d'horaire</span>
              }
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);
  private readonly discoveryApi = inject(DiscoveryApi);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  q = '';
  upcoming: EventDto[] = [];
  discover: EventDto[] = [];
  planning: PlanningEntry[] = [];
  loadingUpcoming = true;
  loadingDiscover = true;
  loadingPlanning = true;

  firstName(): string {
    const name = this.identity.me()?.displayName ?? '';
    return name.split(' ')[0] ?? '';
  }

  ngOnInit(): void {
    this.eventsApi.search({ sort: 'upcoming', take: '4' }).subscribe({
      next: (page) => {
        this.upcoming = page.items;
        this.loadingUpcoming = false;
      },
      error: () => (this.loadingUpcoming = false),
    });
    this.discoveryApi.surprise(3).subscribe({
      next: (events) => {
        this.discover = events;
        this.loadingDiscover = false;
      },
      error: () => (this.loadingDiscover = false),
    });
    this.eventsApi.planning().subscribe({
      next: (entries) => {
        this.planning = entries.slice(0, 3);
        this.loadingPlanning = false;
      },
      error: () => (this.loadingPlanning = false),
    });
  }

  date(event: EventDto): string {
    return formatDateTime(event.startsAt);
  }

  search(): void {
    const query = this.q.trim();
    void this.router.navigate(['/search'], query ? { queryParams: { q: query } } : {});
  }
}
