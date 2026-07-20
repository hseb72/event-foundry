import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
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
  styles: [
    `
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.6rem;
        margin: 0.75rem 0 1.25rem;
      }
      .views {
        display: flex;
        gap: 0.3rem;
        background: var(--surface-2);
        border-radius: 12px;
        padding: 0.25rem;
      }
      .views button {
        border: 0;
        background: transparent;
        color: var(--muted);
        border-radius: 9px;
        padding: 0.4rem 0.8rem;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .views button.on {
        background: var(--exp);
        color: var(--exp-contrast);
      }
      .nav {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-left: auto;
      }
      .period {
        font-weight: 700;
        min-width: 12rem;
        text-align: center;
        text-transform: capitalize;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0 0 1rem;
      }
      .lg {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .lg.on {
        border-color: var(--text);
        box-shadow: 0 0 0 1px var(--text);
      }
      .lg.dim {
        opacity: 0.45;
      }
      .lg .sw {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        display: inline-block;
      }
      .lg .cnt {
        font-weight: 800;
        color: var(--muted);
      }
      .lg.clear {
        color: var(--muted);
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
        margin: 0 0 1.25rem;
        font-size: 0.9rem;
      }
      /* Vue jour */
      .day-list {
        display: grid;
        gap: 0.5rem;
      }
      .slot {
        display: flex;
        gap: 0.8rem;
        align-items: center;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        border-left: 5px solid var(--stripe, var(--exp));
        background: var(--surface);
      }
      .slot .time {
        font-weight: 700;
        min-width: 3.2rem;
        color: var(--text);
      }
      .slot .t {
        font-weight: 600;
      }
      .slot .m {
        color: var(--muted);
        font-size: 0.82rem;
      }
      /* Vue semaine */
      .week {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
      }
      .col {
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
        min-height: 8rem;
        padding: 0.4rem;
      }
      .col.today {
        border-color: var(--exp);
        box-shadow: 0 0 0 1px var(--exp);
      }
      .col h4 {
        margin: 0 0 0.4rem;
        font-size: 0.75rem;
        text-transform: capitalize;
        color: var(--muted);
      }
      .chip {
        display: block;
        border-left: 4px solid var(--stripe, var(--exp));
        background: var(--surface-2);
        border-radius: 6px;
        padding: 0.25rem 0.4rem;
        margin-bottom: 0.3rem;
        font-size: 0.75rem;
      }
      .chip .ct {
        font-weight: 600;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      /* Vue mois */
      .month {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.35rem;
      }
      .dow {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
        text-align: center;
        padding: 0.2rem 0;
      }
      .cell {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        min-height: 5.5rem;
        padding: 0.3rem;
      }
      .cell.out {
        opacity: 0.4;
      }
      .cell.today {
        border-color: var(--exp);
        box-shadow: 0 0 0 1px var(--exp);
      }
      .cell .num {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--muted);
      }
      .cell .dot {
        display: block;
        border-left: 3px solid var(--stripe, var(--exp));
        background: var(--surface-2);
        border-radius: 4px;
        padding: 0.1rem 0.3rem;
        margin-top: 0.2rem;
        font-size: 0.68rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .results {
        display: grid;
        gap: 0.9rem;
      }
      .more {
        font-size: 0.68rem;
        color: var(--muted);
        margin-top: 0.15rem;
      }
    `,
  ],
  template: `
    <h1>Mon planning</h1>
    <p class="muted">Les événements auxquels vous participez — vues jour, semaine, mois.</p>

    <div class="toolbar">
      <div class="views" role="tablist">
        @for (v of viewOptions; track v.key) {
          <button [class.on]="view() === v.key" (click)="view.set(v.key)">{{ v.label }}</button>
        }
      </div>
      @if (view() !== 'list') {
        <div class="nav">
          <button class="btn" (click)="step(-1)" aria-label="Précédent">‹</button>
          <button class="btn" (click)="goToday()">Aujourd'hui</button>
          <button class="btn" (click)="step(1)" aria-label="Suivant">›</button>
          <span class="period">{{ periodLabel() }}</span>
        </div>
      }
    </div>

    <!-- Légende + filtre par statut de participation (palette V1, FSPEC.06). -->
    <div class="legend">
      @for (item of palette; track item.kind) {
        <button
          type="button"
          class="lg"
          [class.on]="filterKind() === item.kind"
          [class.dim]="filterKind() && filterKind() !== item.kind"
          (click)="toggleFilter(item.kind)"
        >
          <span class="sw" [style.background]="item.color"></span>{{ item.label }}
          <span class="cnt">{{ countOf(item.kind) }}</span>
        </button>
      }
      @if (filterKind()) {
        <button type="button" class="lg clear" (click)="filterKind.set(null)">✕ Tout afficher</button>
      }
    </div>

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else if (view() === 'list') {
      @if (!entries().length) {
        <p class="empty">Aucun événement dans votre planning. Déclarez votre intérêt depuis « Découvrir ».</p>
      } @else {
        @if (conflictCount() > 0) {
          <div class="banner">⚠️ {{ conflictCount() }} conflit(s) d'horaire détecté(s).</div>
        }
        @if (!filteredEntries().length) {
          <p class="empty">Aucun événement pour ce filtre.</p>
        }
        <div class="results">
          @for (entry of filteredEntries(); track entry.event.id) {
            <app-event-card [event]="entry.event" />
          }
        </div>
      }
    } @else if (view() === 'day') {
      @if (!eventsOn(anchor()).length) {
        <p class="empty">Aucun événement ce jour-là.</p>
      } @else {
        <div class="day-list">
          @for (event of eventsOn(anchor()); track event.id) {
            <a class="slot" [style.--stripe]="stripe(event)" [routerLink]="['/events', event.id]">
              <span class="time">{{ time(event.startsAt) }}</span>
              <span>
                <span class="t">{{ event.title }}</span>
                <span class="m"> · {{ event.activity }}</span>
              </span>
            </a>
          }
        </div>
      }
    } @else if (view() === 'week') {
      <div class="week">
        @for (day of weekDays(); track day.getTime()) {
          <div class="col" [class.today]="isToday(day)">
            <h4>{{ dayHeader(day) }}</h4>
            @for (event of eventsOn(day); track event.id) {
              <a class="chip" [style.--stripe]="stripe(event)" [routerLink]="['/events', event.id]">
                <span class="ct">{{ time(event.startsAt) }} {{ event.title }}</span>
              </a>
            }
          </div>
        }
      </div>
    } @else {
      <div class="month">
        @for (d of weekdayLabels; track d) {
          <div class="dow">{{ d }}</div>
        }
        @for (day of monthDays(); track day.getTime()) {
          <div class="cell" [class.out]="!inMonth(day)" [class.today]="isToday(day)">
            <div class="num">{{ day.getDate() }}</div>
            @for (event of eventsOn(day).slice(0, 3); track event.id) {
              <a class="dot" [style.--stripe]="stripe(event)" [routerLink]="['/events', event.id]">
                {{ event.title }}
              </a>
            }
            @if (eventsOn(day).length > 3) {
              <div class="more">+{{ eventsOn(day).length - 3 }}</div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class CalendarComponent implements OnInit {
  private readonly eventsApi = inject(EventsApi);

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

  /** Nombre d'événements du planning ayant ce statut dominant (résumé de la légende). */
  countOf(kind: ParticipationKind): number {
    return this.all().filter((event) => participationKind(event.participation) === kind).length;
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
