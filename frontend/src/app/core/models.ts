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

export interface ReferentialItem {
  id: string;
  name: string;
}

export interface EventCandidateDto {
  id: string;
  importJobId: string;
  status: string;
  payload: Record<string, unknown>;
  confidence: Record<string, number>;
  correctedAt: string | null;
  createdAt: string;
}

export interface EventCandidateDetailDto extends EventCandidateDto {
  ocrText: string | null;
}

export interface CreateEventInput {
  activityId: string;
  eventTypeId?: string;
  eventFormatId?: string;
  organizerId?: string;
  venueId?: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  price?: number;
  currency?: string;
}

export interface ImportStatsDto {
  totalImports: number;
  importsByStatus: Record<string, number>;
  transitionsByStatus: Record<string, number>;
  durations: {
    avgOcrProcessingMs: number | null;
    avgTotalMs: number | null;
    sampleCount: number;
  };
  totalCandidates: number;
  candidatesByStatus: Record<string, number>;
  totalEvents: number;
  eventsBySource: Record<string, number>;
}

/** Valeurs détectées (noms) proposées par le moteur expert, pour préremplir un formulaire. */
export interface EventDraft {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  price?: number;
  currency?: string;
  activityName?: string;
  eventTypeName?: string;
  eventFormatName?: string;
  organizerName?: string;
  venueName?: string;
}
