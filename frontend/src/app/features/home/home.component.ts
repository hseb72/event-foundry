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
import {
  PARTICIPATION_PALETTE,
  ParticipationKind,
  participationColor,
  participationKind,
  participationLabel,
} from '../../shared/participation-color';

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
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
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
  upcomingEvents: EventDto[] = [];
  upcomingBuckets: PeriodBuckets<EventDto> = EMPTY_BUCKETS;
  discoverBuckets: PeriodBuckets<EventDto> = EMPTY_BUCKETS;
  planning: PlanningEntry[] = [];
  loadingUpcoming = true;
  loadingDiscover = true;
  loadingPlanning = true;

  // Filtre de participation sur « À venir » (réutilise la palette V1 — source unique FSPEC.05).
  readonly palette = PARTICIPATION_PALETTE;
  filter: ParticipationKind | 'ALL' = 'ALL';

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

  setFilter(kind: ParticipationKind | 'ALL'): void {
    this.filter = kind;
  }

  upcomingCount(): number {
    return this.upcomingEvents.length;
  }

  /** Nombre d'événements « À venir » pour un statut de participation dominant. */
  countFor(kind: ParticipationKind): number {
    return this.upcomingEvents.filter((e) => participationKind(e.participation) === kind).length;
  }

  /** Répartition période × filtre de participation courant. */
  filteredBuckets(): PeriodBuckets<EventDto> {
    if (this.filter === 'ALL') {
      return this.upcomingBuckets;
    }
    const events = this.upcomingEvents.filter((e) => participationKind(e.participation) === this.filter);
    return bucketByPeriod(events, (e) => e.startsAt);
  }

  /** Couleur de la pastille de participation (palette V1). */
  stripe(event: EventDto): string {
    return participationColor(event.participation);
  }

  /** Libellé de participation dominant (vide si aucun). */
  statusLabel(event: EventDto): string {
    return participationLabel(event.participation);
  }

  ngOnInit(): void {
    // « À venir » = événements qualifiés (participation) → endpoint planning.
    this.eventsApi.planning().subscribe({
      next: (entries) => {
        const events = entries.map((entry) => entry.event);
        this.upcomingEvents = events;
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
