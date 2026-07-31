import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ParticipationResponse, PaymentStatus, ReservationStatus } from '../models';

export interface ParticipationUpdate {
  interested?: boolean;
  reservationStatus?: ReservationStatus;
  paymentStatus?: PaymentStatus;
}

@Injectable({ providedIn: 'root' })
export class ParticipationApi {
  constructor(private readonly http: HttpClient) {}

  update(eventId: string, body: ParticipationUpdate): Observable<ParticipationResponse> {
    return this.http.put<ParticipationResponse>(
      `${API_BASE}/events/${eventId}/participation`,
      body,
    );
  }
}
