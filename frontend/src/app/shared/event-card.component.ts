import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ParticipationApi } from '../core/api/participation.service';
import { EventDto, ParticipationState, PaymentStatus, ReservationStatus } from '../core/models';
import { formatDateTime } from './date-format';
import { participationColor, participationLabel } from './participation-color';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [
    `
      .event {
        display: grid;
        gap: 0.6rem;
        border-left: 6px solid var(--stripe, transparent);
      }
      .title {
        font-weight: 700;
        font-size: 1.05rem;
        color: inherit;
      }
      .title:hover {
        color: var(--accent);
      }
      .meta {
        color: var(--muted);
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }
      .actions select {
        padding: 0.35rem 0.5rem;
        border-radius: 8px;
        border: 1px solid var(--border);
      }
      .state {
        margin-left: auto;
        font-weight: 600;
        font-size: 0.85rem;
      }
    `,
  ],
  template: `
    <div class="card event" [style.--stripe]="color()">
      <a class="title" [routerLink]="['/events', event.id]">{{ event.title }}</a>
      <div class="meta">
        {{ displayDate() }} · {{ event.activity }}
        @if (event.eventType) {
          · {{ event.eventType }}
        }
      </div>
      <div class="meta">
        @if (event.venue) {
          {{ event.venue }}
        }
        @if (event.city) {
          — {{ event.city }}
        }
        @if (event.price !== null) {
          · {{ event.price }} {{ event.currency ?? 'EUR' }}
        }
      </div>

      <div class="actions">
        <button
          class="btn"
          [class.active]="participation.interested"
          (click)="toggleInterested()"
        >
          {{ participation.interested ? 'Intéressé ✓' : "Je suis intéressé" }}
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
  `,
})
export class EventCardComponent {
  @Input({ required: true }) event!: EventDto;

  participation: ParticipationState = { interested: false, reservationStatus: 'NONE', paymentStatus: 'NONE' };

  constructor(private readonly participationApi: ParticipationApi) {}

  ngOnInit(): void {
    if (this.event.participation) {
      this.participation = { ...this.event.participation };
    }
  }

  color(): string {
    return participationColor(this.participation);
  }

  label(): string {
    return participationLabel(this.participation);
  }

  displayDate(): string {
    return formatDateTime(this.event.startsAt);
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

  private save(
    body: { interested?: boolean; reservationStatus?: ReservationStatus; paymentStatus?: PaymentStatus },
  ): void {
    this.participationApi.update(this.event.id, body).subscribe((response) => {
      this.participation = {
        interested: response.interested,
        reservationStatus: response.reservationStatus,
        paymentStatus: response.paymentStatus,
      };
    });
  }
}
