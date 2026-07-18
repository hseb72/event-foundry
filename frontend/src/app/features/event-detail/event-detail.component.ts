import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { ParticipationApi } from '../../core/api/participation.service';
import { EventDto, ParticipationState, PaymentStatus, ReservationStatus } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';
import { participationColor, participationLabel } from '../../shared/participation-color';

/** Fiche détaillée d'un Event (EPIC 11). Consultation complète + actions de participation. */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [
    `
      .back {
        display: inline-block;
        margin-bottom: 1rem;
        color: var(--muted);
      }
      .head {
        border-left: 6px solid var(--stripe, transparent);
        padding-left: 1rem;
      }
      h1 {
        margin-bottom: 0.25rem;
      }
      .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.06);
        vertical-align: middle;
        margin-left: 0.5rem;
      }
      dl {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 0.5rem 1rem;
        margin: 1.25rem 0;
      }
      dt {
        color: var(--muted);
        font-weight: 600;
      }
      .desc {
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-top: 1rem;
      }
      .actions select {
        padding: 0.35rem 0.5rem;
        border-radius: 8px;
        border: 1px solid var(--border);
      }
      .state {
        font-weight: 700;
      }
    `,
  ],
  template: `
    <a class="back" routerLink="/discover">← Retour</a>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (!event) {
      <p class="muted">Événement introuvable.</p>
    } @else {
      <div class="head card" [style.--stripe]="color()">
        <h1>
          {{ event.title }}
          <span class="badge">{{ event.source === 'IMPORT' ? 'Importé' : 'Manuel' }}</span>
        </h1>

        <dl>
          <dt>Date</dt>
          <dd>{{ dateRange() }}</dd>

          <dt>Activité</dt>
          <dd>
            {{ event.activity }}
            @if (event.eventType) {
              · {{ event.eventType }}
            }
            @if (event.eventFormat) {
              · {{ event.eventFormat }}
            }
          </dd>

          @if (event.organizer) {
            <dt>Organisateur</dt>
            <dd>{{ event.organizer }}</dd>
          }
          @if (event.venue || event.city) {
            <dt>Lieu</dt>
            <dd>{{ event.venue }}{{ event.venue && event.city ? ' — ' : '' }}{{ event.city }}</dd>
          }
          @if (event.price !== null) {
            <dt>Prix</dt>
            <dd>{{ event.price }} {{ event.currency ?? 'EUR' }}</dd>
          }
        </dl>

        @if (event.description) {
          <p class="desc">{{ event.description }}</p>
        }

        <div class="actions">
          <button class="btn" [class.active]="participation.interested" (click)="toggleInterested()">
            {{ participation.interested ? 'Intéressé ✓' : 'Je suis intéressé' }}
          </button>

          <select [(ngModel)]="participation.reservationStatus" (ngModelChange)="onReservation($event)">
            <option value="NONE">Réservation…</option>
            <option value="RESERVED">Réservé</option>
            <option value="WAITLIST">Liste d'attente</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select [(ngModel)]="participation.paymentStatus" (ngModelChange)="onPayment($event)">
            <option value="NONE">Paiement…</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="REFUNDED">Remboursé</option>
          </select>

          <span class="state" [style.color]="color()">{{ label() }}</span>
        </div>
      </div>
    }
  `,
})
export class EventDetailComponent implements OnInit {
  event: EventDto | null = null;
  loading = true;
  participation: ParticipationState = {
    interested: false,
    reservationStatus: 'NONE',
    paymentStatus: 'NONE',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventsApi: EventsApi,
    private readonly participationApi: ParticipationApi,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.eventsApi.getById(id).subscribe({
      next: (event) => {
        this.event = event;
        if (event.participation) {
          this.participation = { ...event.participation };
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  color(): string {
    return participationColor(this.participation);
  }

  label(): string {
    return participationLabel(this.participation);
  }

  dateRange(): string {
    if (!this.event) {
      return '';
    }
    const start = formatDateTime(this.event.startsAt);
    return this.event.endsAt ? `${start} → ${formatDateTime(this.event.endsAt)}` : start;
  }

  toggleInterested(): void {
    this.save({ interested: !this.participation.interested });
  }

  onReservation(value: ReservationStatus): void {
    this.save({ reservationStatus: value });
  }

  onPayment(value: PaymentStatus): void {
    this.save({ paymentStatus: value });
  }

  private save(body: {
    interested?: boolean;
    reservationStatus?: ReservationStatus;
    paymentStatus?: PaymentStatus;
  }): void {
    if (!this.event) {
      return;
    }
    this.participationApi.update(this.event.id, body).subscribe((response) => {
      this.participation = {
        interested: response.interested,
        reservationStatus: response.reservationStatus,
        paymentStatus: response.paymentStatus,
      };
    });
  }
}
