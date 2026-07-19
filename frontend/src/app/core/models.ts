export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

/** Expériences utilisateur V2 (ADR.10/ADR.11). */
export type Experience = 'EXPLORER' | 'ORGANIZER' | 'OPERATOR';

/** Organisation à laquelle l'utilisateur appartient (vue « moi »). */
export interface IdentityOrganization {
  id: string;
  name: string;
  slug: string;
  roles: string[];
  subscription: string | null;
}

/** Organisation vue par l'administration (GET /identity/organizations). */
export interface OrganizationAdmin {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subscription: string | null;
  memberCount: number;
}

/** Vue « moi » de l'identité effective (GET /identity/me). */
export interface IdentityMe {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  experiences: Experience[];
  activeExperience: Experience | null;
  activeOrganizationId: string | null;
  subscription: string | null;
  organizations: IdentityOrganization[];
}

export interface ParticipationState {
  interested: boolean;
  reservationStatus: string;
  paymentStatus: string;
}

export interface EventDto {
  id: string;
  source: string;
  status: string;
  title: string;
  description: string | null;
  activity: string;
  eventType: string | null;
  eventFormat: string | null;
  category: string | null;
  organizer: string | null;
  venue: string | null;
  municipality: string | null;
  region: string | null;
  country: string | null;
  tags: string[];
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

export interface ImportJobEventDto {
  status: string;
  occurredAt: string;
  correlationId: string;
}

export interface OcrMetadataDto {
  confidence: number | null;
  language: string | null;
  engine: string | null;
  engineVersion: string | null;
  pageCount: number | null;
  processingTimeMs: number | null;
}

export interface ImportDetailDto extends ImportResponse {
  attachment: { type: string; originalName: string | null; contentType: string; sizeBytes: number };
  ocrText: string | null;
  ocr: OcrMetadataDto | null;
  timeline: ImportJobEventDto[];
}

export interface AdminUserDto {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isActive: boolean;
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
  categoryId?: string;
  organizerId?: string;
  venueId?: string;
  municipalityId?: string;
  tagIds?: string[];
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
