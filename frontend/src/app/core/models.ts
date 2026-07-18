export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface ParticipationState {
  interested: boolean;
  reservationStatus: string;
  paymentStatus: string;
}

export interface EventDto {
  id: string;
  source: string;
  title: string;
  description: string | null;
  activity: string;
  eventType: string | null;
  eventFormat: string | null;
  organizer: string | null;
  venue: string | null;
  city: string | null;
  startsAt: string;
  endsAt: string | null;
  price: number | null;
  currency: string | null;
  participation: ParticipationState | null;
}

export interface PaginatedEvents {
  items: EventDto[];
  total: number;
  skip: number;
  take: number;
}

export interface ParticipationResponse {
  eventId: string;
  interested: boolean;
  reservationStatus: string;
  paymentStatus: string;
  active: boolean;
}

export interface ImportResponse {
  id: string;
  type: string;
  status: string;
  candidateCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  name: string;
  domainId: string;
  isActive: boolean;
  createdAt: string;
}

export type ReservationStatus = 'NONE' | 'RESERVED' | 'WAITLIST' | 'CANCELLED';
export type PaymentStatus = 'NONE' | 'PENDING' | 'PAID' | 'REFUNDED';
