import { CasePriority, CaseStatus } from '@prisma/client';
import { route, workQueueFor, type CaseDomain, type RoutingResult } from './case-catalog';

/**
 * Contexte d'évaluation du routage d'une Case (§14 §Critères de routage). Étend les critères simples
 * sans coupler le moteur au reste : chaque champ est optionnel et comparé de façon déterministe.
 */
export interface RoutingContext {
  type: string;
  origin: string;
  organizationId?: string | null;
  eventId?: string | null;
  aiConfidence?: number | null;
  priority?: CasePriority | null;
}

/** Critères d'une règle : toutes les conditions présentes doivent matcher (ET logique). */
export interface RoutingCriteria {
  types?: string[];
  origins?: string[];
  organizationId?: string;
  requiresEvent?: boolean;
  aiConfidenceBelow?: number;
}

/** Résultat d'une règle applicable (§14 §Résultat). Domaine obligatoire ; le reste est optionnel. */
export interface RoutingRuleResult {
  domain: CaseDomain;
  workQueue?: string;
  priority?: CasePriority;
  initialStatus?: CaseStatus;
  defaultAssigneeId?: string;
}

export interface RoutingRuleDef {
  id: string;
  name: string;
  orderIndex: number;
  criteria: RoutingCriteria;
  result: RoutingRuleResult;
}

/** Décision de routage complète (§14). `initialStatus`/`defaultAssigneeId` proviennent d'une règle. */
export interface RoutingDecision extends RoutingResult {
  initialStatus: CaseStatus;
  defaultAssigneeId: string | null;
  matchedRuleId: string | null;
}

/** Une règle s'applique-t-elle au contexte ? (toutes les conditions présentes doivent être vraies.) */
export function matches(criteria: RoutingCriteria, ctx: RoutingContext): boolean {
  if (criteria.types && !criteria.types.includes(ctx.type)) {
    return false;
  }
  if (criteria.origins && !criteria.origins.includes(ctx.origin)) {
    return false;
  }
  if (criteria.organizationId && criteria.organizationId !== ctx.organizationId) {
    return false;
  }
  if (criteria.requiresEvent && !ctx.eventId) {
    return false;
  }
  if (
    criteria.aiConfidenceBelow != null &&
    !(ctx.aiConfidence != null && ctx.aiConfidence < criteria.aiConfidenceBelow)
  ) {
    return false;
  }
  return true;
}

/**
 * Évalue les règles **triées par `orderIndex` croissant** : la première applicable l'emporte (§14
 * §Priorité des règles). En l'absence de correspondance, repli sur le catalogue déterministe
 * (`route`) — aucune Case ne reste sans destination (CASE-012).
 */
export function decideRouting(rules: RoutingRuleDef[], ctx: RoutingContext): RoutingDecision {
  const ordered = [...rules].sort((a, b) => a.orderIndex - b.orderIndex);
  for (const rule of ordered) {
    if (matches(rule.criteria, ctx)) {
      const domain = rule.result.domain;
      return {
        domain,
        workQueue: rule.result.workQueue ?? workQueueFor(domain),
        priority: rule.result.priority ?? ctx.priority ?? route(ctx.type).priority,
        initialStatus: rule.result.initialStatus ?? CaseStatus.NEW,
        defaultAssigneeId: rule.result.defaultAssigneeId ?? null,
        matchedRuleId: rule.id,
      };
    }
  }
  const fallback = route(ctx.type, ctx.priority ?? undefined);
  return { ...fallback, initialStatus: CaseStatus.NEW, defaultAssigneeId: null, matchedRuleId: null };
}
