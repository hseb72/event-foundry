import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ParticipationApi } from '../core/api/participation.service';
import { EventDto, ParticipationState, PaymentStatus, ReservationStatus } from '../core/models';
import { formatDateTime } from './date-format';
import { participationColor, participationLabel } from './participation-color';
import { eventCoverBackground } from './event-cover';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.css',
})
export class EventCardComponent implements OnInit {
  private readonly participationApi = inject(ParticipationApi);

  @Input({ required: true }) event!: EventDto;

  participation: ParticipationState = {
    interested: false,
    reservationStatus: 'NONE',
    paymentStatus: 'NONE',
  };

  ngOnInit(): void {
    if (this.event.participation) {
      this.participation = { ...this.event.participation };
    }
  }

  /** Fond de la couverture — logique partagée (image de couverture, sinon dégradé festif). */
  coverBg(): string {
    return eventCoverBackground(this.event);
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

  private save(body: {
    interested?: boolean;
    reservationStatus?: ReservationStatus;
    paymentStatus?: PaymentStatus;
  }): void {
    this.participationApi.update(this.event.id, body).subscribe((response) => {
      this.participation = {
        interested: response.interested,
        reservationStatus: response.reservationStatus,
        paymentStatus: response.paymentStatus,
      };
    });
  }
}
