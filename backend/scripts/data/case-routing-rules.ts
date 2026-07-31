import { CasePriority } from '@prisma/client';
import type { RoutingCriteria, RoutingRuleResult } from '../../src/cases/case-routing';

/**
 * Jeu de départ des **règles de routage des Cases** (FSPEC.21 §14).
 *
 * Principe directeur : le catalogue déterministe (`case-catalog.ts`) oriente **déjà** chaque type
 * vers un domaine et une priorité, et garantit qu'aucune Case ne reste sans destination (CASE-012).
 * Une règle n'a donc d'intérêt que si elle exprime une nuance **que le catalogue ne peut pas
 * exprimer** — un croisement de critères (origine, rattachement à un événement, confiance IA) ou une
 * priorité différente selon le contexte. Les règles qui ne feraient que répéter le routage par
 * défaut sont volontairement absentes : elles alourdiraient la lecture sans rien changer.
 *
 * Évaluation : `orderIndex` croissant, **la première règle applicable l'emporte**. Les index sont
 * espacés de 10 pour permettre d'insérer une règle intermédiaire sans tout renuméroter. Les critères
 * d'une même règle se combinent en **ET**.
 *
 * Ordre retenu : d'abord le **préjudice et le légal** (abus, RGPD, incident de production), ensuite
 * la **qualité d'extraction IA**, enfin les nuances de service. Les règles IA ne filtrent pas sur le
 * type — une confiance dégradée mérite une relecture quelle que soit l'origine — mais elles passent
 * volontairement **après** les règles de préjudice : un signalement d'abus assorti d'une confiance
 * faible doit rester en modération, pas être détourné vers les opérations IA.
 *
 * Ce jeu est un **point de départ** : il est entièrement modifiable depuis la console Operator
 * (Dossiers → Règles de routage), y compris désactivable règle par règle.
 */
export interface RoutingRuleSeed {
  /** Suffixe d'identifiant stable (2 chiffres) — garantit l'idempotence du seed. */
  key: string;
  name: string;
  orderIndex: number;
  /** Intention de la règle, reprise en commentaire : pourquoi elle existe. */
  rationale: string;
  criteria: RoutingCriteria;
  result: RoutingRuleResult;
}

export const CASE_ROUTING_RULES: RoutingRuleSeed[] = [
  {
    key: '01',
    name: 'IA — confiance très faible',
    orderIndex: 40,
    rationale:
      "Une extraction dont la confiance s'effondre est probablement inexploitable : elle passe en " +
      'tête de file des opérations IA pour être reprise avant que le contenu ne se diffuse.',
    criteria: { aiConfidenceBelow: 0.35 },
    result: { domain: 'AI_OPERATIONS', priority: CasePriority.CRITICAL },
  },
  {
    key: '02',
    name: 'IA — confiance faible',
    orderIndex: 50,
    rationale:
      'Confiance dégradée sans être critique : relecture par les opérations IA, en priorité haute. ' +
      'Placée après la règle 40, qui capte les cas les plus dégradés.',
    criteria: { aiConfidenceBelow: 0.6 },
    result: { domain: 'AI_OPERATIONS', priority: CasePriority.HIGH },
  },
  {
    key: '03',
    name: 'Abus visant un événement publié',
    orderIndex: 10,
    rationale:
      "Un signalement d'abus rattaché à un événement concerne un contenu déjà visible au catalogue : " +
      'traitement en modération, priorité critique (préjudice en cours).',
    criteria: { types: ['ABUSE_REPORT'], requiresEvent: true },
    result: { domain: 'MODERATION', priority: CasePriority.CRITICAL },
  },
  {
    key: '04',
    name: 'Demande RGPD',
    orderIndex: 20,
    rationale:
      'Les demandes RGPD sont encadrées par des délais légaux : conformité, priorité critique. ' +
      'Le catalogue les oriente déjà vers COMPLIANCE ; la règle relève la priorité.',
    criteria: { types: ['GDPR_REQUEST'] },
    result: { domain: 'COMPLIANCE', priority: CasePriority.CRITICAL },
  },
  {
    key: '05',
    name: 'Incident technique constaté en interne',
    orderIndex: 30,
    rationale:
      "Un incident remonté par un Operator ou par la plateforme elle-même signale une anomalie de " +
      'production, à traiter avant les incidents rapportés par les utilisateurs.',
    criteria: { types: ['TECHNICAL_INCIDENT'], origins: ['OPERATOR', 'PLATFORM'] },
    result: { domain: 'BACKEND_SUPPORT', priority: CasePriority.CRITICAL },
  },
  {
    key: '06',
    name: 'Correction de données sur un événement',
    orderIndex: 60,
    rationale:
      "Une correction portant sur un événement relève de la curation du catalogue (modération) " +
      'plutôt que du support technique, vers lequel le catalogue oriente par défaut.',
    criteria: { types: ['DATA_CORRECTION'], requiresEvent: true },
    result: { domain: 'MODERATION', priority: CasePriority.MEDIUM },
  },
  {
    key: '07',
    name: 'Demande de support d’un organisateur',
    orderIndex: 70,
    rationale:
      'Les organisateurs alimentent le catalogue : leurs demandes de support sont servies en ' +
      'priorité haute, sans changer de domaine.',
    criteria: { types: ['SUPPORT_REQUEST'], origins: ['ORGANIZER'] },
    result: { domain: 'FRONTEND_SUPPORT', priority: CasePriority.HIGH },
  },
  {
    key: '08',
    name: 'Facturation — compte organisateur',
    orderIndex: 80,
    rationale:
      "Une question de facturation émanant d'un organisateur touche à la relation commerciale : " +
      'même domaine que le routage par défaut, mais servie en priorité haute.',
    criteria: { types: ['BILLING_REQUEST'], origins: ['ORGANIZER'] },
    result: { domain: 'FINANCE', priority: CasePriority.HIGH },
  },
];
