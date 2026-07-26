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

/** Valeur de facette : un référentiel et le nombre d'événements publiés associés. */
export interface FacetCount {
  id: string;
  name: string;
  count: number;
}

/** Facettes de navigation de la découverte. */
export interface Facets {
  activities: FacetCount[];
  categories: FacetCount[];
  municipalities: FacetCount[];
  tags: FacetCount[];
}

/** Notification interne de l'utilisateur (EPIC 08). */
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  status: 'UNREAD' | 'READ';
  eventId: string | null;
  createdAt: string;
  readAt: string | null;
}

/** Action possible sur une recommandation (EPIC 06). */
export type RecommendationAction = 'ACCEPTED' | 'IGNORED' | 'REJECTED';

/** Recommandation explicable : un événement, son score déterministe et ses justifications. */
export interface Recommendation {
  event: EventDto;
  score: number;
  reasons: string[];
}

/** Entrée du planning personnel : un événement + ses conflits d'horaire. */
export interface PlanningEntry {
  event: EventDto;
  conflictsWith: string[];
}

/** Entrée du journal des transitions de statut d'un Event. */
export interface EventStatusEventDto {
  fromStatus: string | null;
  toStatus: string;
  actorId: string | null;
  occurredAt: string;
}

/** Média (image) d'un Event, avec URL de lecture temporaire. */
export interface EventMediaDto {
  id: string;
  url: string;
  contentType: string;
  position: number;
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
  /** Préférences personnelles (thème, langue, notifications…). Source : User Preferences (ADR.20). */
  preferences?: Record<string, unknown> | null;
}

/** Thème d'interface (préférence utilisateur, ADR.22 §Thèmes). */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface ParticipationState {
  interested: boolean;
  reservationStatus: string;
  paymentStatus: string;
}

export interface EventDto {
  id: string;
  source: string;
  status: string;
  visibility: string;
  title: string;
  description: string | null;
  activity: string;
  eventType: string | null;
  eventFormat: string | null;
  category: string | null;
  organizer: string | null;
  venue: string | null;
  activityId: string;
  categoryId: string | null;
  organizerId: string | null;
  venueId: string | null;
  municipality: string | null;
  region: string | null;
  country: string | null;
  tags: string[];
  media: EventMediaDto[];
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
  /** Alias actifs (libellés alternatifs reconnus) — résolution alias-aware. */
  aliases?: string[];
  createdAt: string;
}

export type ReservationStatus = 'NONE' | 'RESERVED' | 'WAITLIST' | 'CANCELLED';
export type PaymentStatus = 'NONE' | 'PENDING' | 'PAID' | 'REFUNDED';

export interface ReferentialItem {
  id: string;
  name: string;
}

/** Commune résolue par pays + code postal, région dérivée (Localisation V3, chantier §8.1). */
export interface MunicipalityGeo {
  id: string;
  name: string;
  postalCode: string | null;
  regionId: string;
  regionName: string;
  countryId: string;
  countryName: string;
}

/** Types d'objets suivables (Follow — ADR.19 / FSPEC.06). */
export type FollowTargetType =
  | 'ORGANIZATION'
  | 'ORGANIZER'
  | 'VENUE'
  | 'ACTIVITY'
  | 'CATEGORY'
  | 'EVENT_SERIES';

/** Suivi durable utilisateur → objet. */
export interface Follow {
  id: string;
  targetType: FollowTargetType;
  targetId: string;
  notify: boolean;
  createdAt: string;
}

/** Cas d'usage IA activables (ADR.16). */
export const AI_USE_CASES = ['OCR', 'DOC_UNDERSTANDING', 'TRANSLATE', 'SUMMARIZE', 'REPHRASE', 'ENRICH'] as const;
export type AiUseCase = (typeof AI_USE_CASES)[number];

/** Résultat d'une assistance IA « texte » (traduction/résumé). assisted=false = repli déterministe. */
export interface AssistResult {
  useCase: string;
  assisted: boolean;
  text: string | null;
  provider: string | null;
}

/** Fournisseur IA proposé (guidage : modèles suggérés, où trouver la clé). */
export interface AiProviderInfo {
  id: string;
  label: string;
  kind: string;
  suggestedModels: string[];
  requiresKey: boolean;
  keyUrl: string | null;
  keyHint: string | null;
}

/** Configuration IA d'une portée (la clé n'est jamais renvoyée — seulement des métadonnées masquées). */
export interface AiConfig {
  scope: string;
  scopeKey: string;
  provider: string;
  model: string;
  enabled: boolean;
  useCases: Record<string, boolean>;
  status: string;
  secret: { reference: string; masked: string; status: string } | null;
}

export interface UpdateAiConfigInput {
  provider: string;
  model: string;
  enabled: boolean;
  useCases: Record<string, boolean>;
  apiKey?: string;
}

/** Choix de vecteur pour une piste de fréquence de notification (ou « aucun »). */
export type NotificationVectorChoice = 'none' | 'email' | 'push';

/** Préférences de notifications de l'utilisateur : un vecteur par piste de fréquence (FSPEC.04). */
export interface NotificationPreferences {
  immediate: NotificationVectorChoice;
  daily: NotificationVectorChoice;
  weekly: NotificationVectorChoice;
}

/** Réglages globaux des notifications (Operator) : vecteurs et pistes activés (in-app toujours actif). */
export interface NotificationSettings {
  vectors: { email: boolean; push: boolean };
  frequencies: { immediate: boolean; daily: boolean; weekly: boolean };
}

/** Statistiques d'appels IA (supervision Operator — Observabilité). Aucun contenu ni secret. */
export interface AiCallStats {
  total: number;
  failures: number;
  failureRate: number;
  byProvider: { provider: string; total: number; failures: number; avgDurationMs: number }[];
  byUseCase: { useCase: string; total: number; failures: number }[];
}

/** Type de référentiel auto-provisionnable (ADR.24). */
export type ProvisionalType = 'activity' | 'eventType' | 'eventFormat' | 'organizer' | 'venue';

/** Entrée de la file de curation des référentiels provisoires (ADR.24). */
export interface ProvisionalEntry {
  type: ProvisionalType;
  id: string;
  name: string;
  context: string | null;
  createdAt: string;
}

/** Limites techniques plateforme (OPE-005 §Technique). Aucune donnée secrète. */
export interface TechnicalConfig {
  maxUploadBytes: number;
  maxImportsPerDay: number;
  hardMaxUploadBytes: number;
  /** Auto-provisioning des référentiels manquants (ADR.24). */
  autoProvisionReferentials: boolean;
  provisioningDefaultDomainId: string | null;
}

export interface UpdateTechnicalConfigInput {
  maxUploadBytes: number;
  maxImportsPerDay: number;
  autoProvisionReferentials?: boolean;
  provisioningDefaultDomainId?: string;
}

/** Configuration mail plateforme (le mot de passe n'est jamais renvoyé). */
export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username: string | null;
  passwordMasked: string | null;
  status: string;
}

export interface UpdateMailConfigInput {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  username?: string;
  password?: string;
}

/** Adresse d'organisation (Localisation V3, chantier §8.2), région/commune dérivées. */
export interface OrganizationAddress {
  id: string;
  organizationId: string;
  label: string;
  countryId: string;
  countryName: string;
  postalCode: string;
  municipalityId: string | null;
  municipalityName: string | null;
  regionName: string | null;
  streetLines: string;
  isPrimary: boolean;
}

export interface CreateOrganizationAddressInput {
  label: string;
  countryId: string;
  postalCode: string;
  municipalityId?: string;
  streetLines: string;
  isPrimary?: boolean;
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

/** Vue d'édition d'un Event (référentiels par identifiant) pour préremplir le formulaire. */
export interface EventEditValue {
  id: string;
  status: string;
  editable: boolean;
  activityId: string;
  eventTypeId: string | null;
  eventFormatId: string | null;
  categoryId: string | null;
  organizerId: string | null;
  venueId: string | null;
  countryId: string | null;
  regionId: string | null;
  municipalityId: string | null;
  tagIds: string[];
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  price: number | null;
  currency: string | null;
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

/** Vision globale de l'état de la plateforme (tableau de bord Operator — OPE-001). */
export interface PlatformOverviewDto {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  organizations: number;
  totalEvents: number;
  eventsByStatus: Record<string, number>;
  pendingValidations: number;
  failedImports: number;
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
