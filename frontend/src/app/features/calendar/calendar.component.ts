import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { ParticipationApi } from '../../core/api/participation.service';
import { EventDto, PlanningEntry } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';
import {
  PARTICIPATION_PALETTE,
  ParticipationKind,
  participationColor,
  participationKind,
} from '../../shared/participation-color';

type CalendarView = 'day' | 'week' | 'month' | 'list';

/**
 * Mon planning (FSPEC.12) : les événements qualifiés (participation) présentés en vues calendrier
 * jour / semaine / mois, plus une vue liste conservant la détection de conflits. L'accès au passé
 * est disponible via la navigation temporelle (le calendrier renvoie déjà tout l'historique).
 */
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [EventCardComponent, RouterLink],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
})
export class CalendarComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);
  private readonly participationApi = inject(ParticipationApi);

  readonly all = signal<EventDto[]>([]);
  readonly entries = signal<PlanningEntry[]>([]);
  readonly loading = signal(true);
  readonly view = signal<CalendarView>('week');
  readonly anchor = signal<Date>(startOfDay(new Date()));
  /** Filtre par statut de participation (palette V1) ; null = tous. */
  readonly filterKind = signal<ParticipationKind | null>(null);

  readonly viewOptions: { key: CalendarView; label: string }[] = [
    { key: 'day', label: 'Jour' },
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'list', label: 'Liste' },
  ];
  readonly weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  readonly palette = PARTICIPATION_PALETTE;

  /** Événements après application du filtre de participation (source des vues calendrier). */
  readonly filtered = computed(() => {
    const kind = this.filterKind();
    return kind ? this.all().filter((event) => participationKind(event.participation) === kind) : this.all();
  });

  /** Entrées de la vue liste après filtre. */
  readonly filteredEntries = computed(() => {
    const kind = this.filterKind();
    return kind
      ? this.entries().filter((entry) => participationKind(entry.event.participation) === kind)
      : this.entries();
  });

  readonly conflictCount = computed(
    () => this.filteredEntries().filter((entry) => entry.conflictsWith.length > 0).length,
  );

  /** Identifiants des événements en conflit d'horaire (source : détection du planning). */
  readonly conflictIds = computed(
    () => new Set(this.entries().filter((entry) => entry.conflictsWith.length > 0).map((entry) => entry.event.id)),
  );

  ngOnInit(): void {
    // Tous les événements qualifiés (passé inclus) pour les vues calendrier.
    this.eventsApi.calendar({}).subscribe({
      next: (events) => {
        this.all.set(events);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    // Entrées avec conflits pour la vue liste.
    this.eventsApi.planning().subscribe({ next: (entries) => this.entries.set(entries) });
  }

  eventsOn(day: Date): EventDto[] {
    return this.filtered()
      .filter((event) => isSameDay(new Date(event.startsAt), day))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  toggleFilter(kind: ParticipationKind): void {
    this.filterKind.set(this.filterKind() === kind ? null : kind);
  }

  hasConflict(event: EventDto): boolean {
    return this.conflictIds().has(event.id);
  }

  /** Nombre d'événements du planning ayant ce statut dominant (résumé de la légende). */
  countOf(kind: ParticipationKind): number {
    return this.all().filter((event) => participationKind(event.participation) === kind).length;
  }

  /**
   * Retire un événement du planning (RG-PLN-06 / FSPEC.06) : remet les trois axes à neutre, ce qui
   * supprime la participation. L'événement reste trouvable en recherche.
   */
  removeFromPlanning(event: EventDto): void {
    this.participationApi
      .update(event.id, { interested: false, reservationStatus: 'NONE', paymentStatus: 'NONE' })
      .subscribe(() => {
        this.all.update((list) => list.filter((e) => e.id !== event.id));
        this.entries.update((list) => list.filter((entry) => entry.event.id !== event.id));
      });
  }

  weekDays(): Date[] {
    const start = startOfWeek(this.anchor());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }

  monthDays(): Date[] {
    const first = new Date(this.anchor().getFullYear(), this.anchor().getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }

  step(direction: number): void {
    const d = new Date(this.anchor());
    if (this.view() === 'day') {
      d.setDate(d.getDate() + direction);
    } else if (this.view() === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    this.anchor.set(startOfDay(d));
  }

  goToday(): void {
    this.anchor.set(startOfDay(new Date()));
  }

  periodLabel(): string {
    const a = this.anchor();
    if (this.view() === 'day') {
      return a.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (this.view() === 'week') {
      const start = startOfWeek(a);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return a.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  dayHeader(day: Date): string {
    return day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  }

  time(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  stripe(event: EventDto): string {
    return participationColor(event.participation);
  }

  isToday(day: Date): boolean {
    return isSameDay(day, new Date());
  }

  inMonth(day: Date): boolean {
    return day.getMonth() === this.anchor().getMonth();
  }
}

function startOfDay(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const day = s.getDay(); // 0=dimanche
  const diff = day === 0 ? -6 : 1 - day; // ramène au lundi
  s.setDate(s.getDate() + diff);
  return s;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
