import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { DiscoveryApi } from '../../core/api/discovery.service';
import { EventsApi } from '../../core/api/events.service';
import { IdentityService } from '../../core/api/identity.service';
import { RecommendationApi } from '../../core/api/recommendation.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto, PlanningEntry } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';
import { formatDateTime } from '../../shared/date-format';
import { bucketByPeriod, PeriodBuckets } from '../../shared/date-buckets';

const EMPTY_BUCKETS: PeriodBuckets<EventDto> = { today: [], thisWeek: [], thisMonth: [], later: [] };

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
      .bucket {
        margin-bottom: 1.1rem;
      }
      .bucket-title {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin: 0 0 0.55rem;
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
        <a routerLink="/calendar">Mon planning</a>
      </div>
      @if (loadingUpcoming) {
        <p class="muted">Chargement…</p>
      } @else if (isEmpty(upcomingBuckets)) {
        <p class="empty">Aucun événement qualifié à venir. Déclarez votre intérêt depuis « Découvrir ».</p>
      } @else {
        @for (s of sections; track s.key) {
          @if (upcomingBuckets[s.key].length) {
            <div class="bucket">
              <h3 class="bucket-title">{{ s.label }}</h3>
              <div class="grid">
                @for (event of upcomingBuckets[s.key]; track event.id) {
                  <app-event-card [event]="event" />
                }
              </div>
            </div>
          }
        }
      }
    </section>

    <section>
      <div class="section-head">
        <h2>À découvrir</h2>
        <a routerLink="/discover">Explorer le catalogue</a>
      </div>
      @if (loadingDiscover) {
        <p class="muted">Chargement…</p>
      } @else if (isEmpty(discoverBuckets)) {
        <p class="empty">Rien à suggérer pour l'instant.</p>
      } @else {
        @for (s of sections; track s.key) {
          @if (discoverBuckets[s.key].length) {
            <div class="bucket">
              <h3 class="bucket-title">{{ s.label }}</h3>
              <div class="grid">
                @for (event of discoverBuckets[s.key]; track event.id) {
                  <app-event-card [event]="event" />
                }
              </div>
            </div>
          }
        }
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
  private readonly recommendationApi = inject(RecommendationApi);
  private readonly auth = inject(AuthService);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  q = '';
  // Blocs « À venir » (qualifiés — RG-PLN-02) et « À découvrir » (recommandés non qualifiés),
  // chacun réparti en 3 sections disjointes aujourd'hui / semaine / mois (RG-PLN-04).
  upcomingBuckets: PeriodBuckets<EventDto> = EMPTY_BUCKETS;
  discoverBuckets: PeriodBuckets<EventDto> = EMPTY_BUCKETS;
  planning: PlanningEntry[] = [];
  loadingUpcoming = true;
  loadingDiscover = true;
  loadingPlanning = true;

  readonly sections: { key: keyof PeriodBuckets<EventDto>; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'thisWeek', label: 'Cette semaine' },
    { key: 'thisMonth', label: 'Ce mois-ci' },
    { key: 'later', label: 'Plus tard' },
  ];

  firstName(): string {
    const name = this.identity.me()?.displayName ?? '';
    return name.split(' ')[0] ?? '';
  }

  isEmpty(buckets: PeriodBuckets<EventDto>): boolean {
    return (
      !buckets.today.length &&
      !buckets.thisWeek.length &&
      !buckets.thisMonth.length &&
      !buckets.later.length
    );
  }

  ngOnInit(): void {
    // « À venir » = événements qualifiés (participation) → endpoint planning.
    this.eventsApi.planning().subscribe({
      next: (entries) => {
        const events = entries.map((entry) => entry.event);
        this.upcomingBuckets = bucketByPeriod(events, (e) => e.startsAt);
        this.planning = entries.slice(0, 3);
        this.loadingUpcoming = false;
        this.loadingPlanning = false;
      },
      error: () => {
        this.loadingUpcoming = false;
        this.loadingPlanning = false;
      },
    });
    this.loadDiscover();
  }

  /**
   * « À découvrir » = suggestions non qualifiées (RG-PLN-03). Utilise le moteur de recommandation
   * déterministe (qui tient compte des suivis) si l'utilisateur y a droit ; sinon repli sur la
   * découverte aléatoire.
   */
  private loadDiscover(): void {
    const source = this.auth.hasPermission('recommendation.view')
      ? this.recommendationApi.list(false, 12).pipe(map((recos) => recos.map((r) => r.event)))
      : this.discoveryApi.surprise(12);
    source.subscribe({
      next: (events) => {
        this.discoverBuckets = bucketByPeriod(events, (e) => e.startsAt);
        this.loadingDiscover = false;
      },
      error: () => (this.loadingDiscover = false),
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
