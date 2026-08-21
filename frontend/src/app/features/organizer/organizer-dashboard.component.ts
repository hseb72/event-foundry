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
  templateUrl: './organizer-dashboard.component.html',
  styleUrl: './organizer-dashboard.component.css',
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
