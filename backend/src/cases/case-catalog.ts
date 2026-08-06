import { CasePriority, CaseStatus } from '@prisma/client';

/**
 * Catalogue et routage des Cases (FSPEC.21 §4-6, §9). Volontairement centralisé et **déterministe** :
 * le routage par défaut oriente chaque type vers un Domain / une Work Queue / une priorité, sans
 * modification du code métier (CASE-008/012). Des Routing Rules configurables (§14) pourront s'y
 * superposer dans une tranche ultérieure ; ce catalogue reste le repli garantissant qu'aucune Case
 * ne reste sans destination.
 */

export const CASE_TYPES = [
  'CONTENT_REPORT',
  'ABUSE_REPORT',
  'TECHNICAL_INCIDENT',
  'SUPPORT_REQUEST',
  'ORGANIZATION_VERIFICATION',
  'DATA_CORRECTION',
  'AI_REVIEW',
  'REFERENCE_SUGGESTION',
  'BILLING_REQUEST',
  'GDPR_REQUEST',
  'OTHER',
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_DOMAINS = [
  'MODERATION',
  'FRONTEND_SUPPORT',
  'BACKEND_SUPPORT',
  'AI_OPERATIONS',
  'FINANCE',
  'COMPLIANCE',
  'PLATFORM_ADMIN',
] as const;
export type CaseDomain = (typeof CASE_DOMAINS)[number];

/** Origine d'une Case (§7) : qui/quoi l'a créée. */
export const CASE_ORIGINS = ['EXPLORER', 'ORGANIZER', 'OPERATOR', 'PLATFORM', 'AI'] as const;
export type CaseOrigin = (typeof CASE_ORIGINS)[number];

/** Une Work Queue appartient à un unique Domain (CASE-009) : dérivée du domaine. */
export function workQueueFor(domain: CaseDomain): string {
  return `${domain}_QUEUE`;
}

interface RoutingTarget {
  domain: CaseDomain;
  priority: CasePriority;
}

/** Routage par défaut : type → domaine + priorité initiale (§9). */
const ROUTING: Record<CaseType, RoutingTarget> = {
  CONTENT_REPORT: { domain: 'MODERATION', priority: CasePriority.HIGH },
  ABUSE_REPORT: { domain: 'MODERATION', priority: CasePriority.HIGH },
  TECHNICAL_INCIDENT: { domain: 'BACKEND_SUPPORT', priority: CasePriority.HIGH },
  SUPPORT_REQUEST: { domain: 'FRONTEND_SUPPORT', priority: CasePriority.MEDIUM },
  ORGANIZATION_VERIFICATION: { domain: 'PLATFORM_ADMIN', priority: CasePriority.MEDIUM },
  DATA_CORRECTION: { domain: 'BACKEND_SUPPORT', priority: CasePriority.MEDIUM },
  AI_REVIEW: { domain: 'AI_OPERATIONS', priority: CasePriority.MEDIUM },
  // Proposition d'ajout au référentiel : curation du catalogue, donc modération. Priorité normale —
  // la soumission qui l'a motivée n'est pas bloquée, elle se poursuit sans la référence manquante.
  REFERENCE_SUGGESTION: { domain: 'MODERATION', priority: CasePriority.MEDIUM },
  BILLING_REQUEST: { domain: 'FINANCE', priority: CasePriority.MEDIUM },
  GDPR_REQUEST: { domain: 'COMPLIANCE', priority: CasePriority.HIGH },
  OTHER: { domain: 'PLATFORM_ADMIN', priority: CasePriority.MEDIUM },
};

/** Règle par défaut si le type est inconnu (garantit une destination — CASE-012). */
const FALLBACK: RoutingTarget = { domain: 'PLATFORM_ADMIN', priority: CasePriority.MEDIUM };

export interface RoutingResult {
  domain: CaseDomain;
  workQueue: string;
  priority: CasePriority;
}

/** Oriente une Case à sa création (§9). Priorité explicite (ex. IA) prioritaire sur celle du routage. */
export function route(type: string, overridePriority?: CasePriority): RoutingResult {
  const target = ROUTING[type as CaseType] ?? FALLBACK;
  return {
    domain: target.domain,
    workQueue: workQueueFor(target.domain),
    priority: overridePriority ?? target.priority,
  };
}

/** Transitions de statut autorisées (§11). Une Case n'est jamais supprimée (CASE-007). */
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: [CaseStatus.ASSIGNED, CaseStatus.IN_PROGRESS],
  ASSIGNED: [CaseStatus.IN_PROGRESS, CaseStatus.NEW],
  IN_PROGRESS: [
    CaseStatus.WAITING_FOR_USER,
    CaseStatus.WAITING_FOR_ORGANIZER,
    CaseStatus.RESOLVED,
  ],
  WAITING_FOR_USER: [CaseStatus.IN_PROGRESS],
  WAITING_FOR_ORGANIZER: [CaseStatus.IN_PROGRESS],
  RESOLVED: [CaseStatus.CLOSED, CaseStatus.IN_PROGRESS],
  CLOSED: [CaseStatus.ARCHIVED],
  ARCHIVED: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** États atteignables depuis l'état courant (pour ne proposer que des transitions valides — §11). */
export function allowedTransitionsFor(status: CaseStatus): CaseStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

/** États d'attente : produisent une notification au demandeur (qui peut apporter des éléments). */
export const WAITING_STATES: CaseStatus[] = [
  CaseStatus.WAITING_FOR_USER,
  CaseStatus.WAITING_FOR_ORGANIZER,
];

/** Un passage à cet état concerne le demandeur : le motif lui est rendu visible + notifié (§19). */
export function isRequesterFacing(status: CaseStatus): boolean {
  return (
    WAITING_STATES.includes(status) ||
    status === CaseStatus.RESOLVED ||
    status === CaseStatus.CLOSED
  );
}
