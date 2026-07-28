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
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease;
      }
      .event:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow);
      }
      /* Couverture festive pleine largeur : image de l'événement, sinon dégradé de marque. */
      .cover {
        position: relative;
        margin: -1rem -1.25rem 0.3rem;
        height: 150px;
        background-size: cover;
        background-position: center;
        border-radius: var(--radius) var(--radius) 0 0;
        overflow: hidden;
      }
      .cover .chip {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: #fff;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(4px);
      }
      .cover .price {
        position: absolute;
        top: 0.6rem;
        right: 0.6rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text);
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--surface) 88%, transparent);
        backdrop-filter: blur(4px);
      }
      .title {
        font-weight: 700;
        font-size: 1.05rem;
        color: inherit;
      }
      .title:hover {
        color: var(--exp);
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
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .tag-chip {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.08rem 0.45rem;
        border-radius: 999px;
        background: var(--bg);
        border: 1px solid var(--border);
      }
    `,
  ],
  template: `
    <div class="card event" [style.--stripe]="color()">
      <!-- Couverture (RG-PLN-01) : 1ʳᵉ image si disponible, sinon dégradé festif déterministe. -->
      <div class="cover" [style.background]="coverBg()">
        <span class="chip">{{ event.activity }}</span>
        @if (event.price !== null) {
          <span class="price">{{ event.price }} {{ event.currency ?? 'EUR' }}</span>
        }
      </div>
      <a class="title" [routerLink]="['/events', event.id]">{{ event.title }}</a>
      <div class="meta">
        {{ displayDate() }} · {{ event.activity }}
        @if (event.eventType) {
          · {{ event.eventType }}
        }
      </div>
      <div class="meta">
        @if (event.subjects.length) {
          {{ event.subjects.join(', ') }} ·
        }
        @if (event.municipality) {
          {{ event.municipality }}
        } @else if (event.venue) {
          {{ event.venue }}@if (event.city) { — {{ event.city }} }
        }
      </div>

      @if (event.tags.length) {
        <div class="tags">
          @for (t of event.tags; track t) {
            <span class="tag-chip">{{ t }}</span>
          }
        </div>
      }

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

  /** Dégradés festifs (déclinés du dégradé de marque) pour les événements sans image. */
  private static readonly PLACEHOLDERS = [
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #6366f1, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
  ];

  constructor(private readonly participationApi: ParticipationApi) {}

  ngOnInit(): void {
    if (this.event.participation) {
      this.participation = { ...this.event.participation };
    }
  }

  /** Fond de la couverture : 1ʳᵉ image de l'événement, sinon dégradé festif déterministe (par id). */
  coverBg(): string {
    const image = this.event.media?.find((m) => m.contentType?.startsWith('image/')) ?? this.event.media?.[0];
    if (image) {
      return `center / cover no-repeat url("${image.url}")`;
    }
    let hash = 0;
    for (const ch of this.event.id) hash = (hash + ch.charCodeAt(0)) | 0;
    const list = EventCardComponent.PLACEHOLDERS;
    return list[Math.abs(hash) % list.length];
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
