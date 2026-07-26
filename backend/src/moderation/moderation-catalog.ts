/**
 * Catalogue de la modération (FSPEC.20). Objets modérables (§3), motifs de signalement (§11) et
 * décisions (§13). Le mapping motif→type de Case oriente le signalement vers la bonne file (§9).
 */

export const MODERATION_OBJECTS = ['EVENT', 'ORGANIZATION', 'VENUE', 'IMAGE', 'ACTIVITY'] as const;
export type ModerationObject = (typeof MODERATION_OBJECTS)[number];

export const REPORT_REASONS = [
  'INCORRECT_INFO',
  'OFFENSIVE',
  'DUPLICATE',
  'SPAM',
  'FRAUD',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MODERATION_DECISIONS = [
  'NO_ACTION',
  'REQUEST_CORRECTION',
  'HIDE',
  'SUSPEND',
  'RESTORE',
] as const;
export type ModerationDecision = (typeof MODERATION_DECISIONS)[number];

/** Décisions « importantes » : justification obligatoire (MOD-004). */
export const DECISIONS_REQUIRING_JUSTIFICATION: ModerationDecision[] = [
  'HIDE',
  'SUSPEND',
  'RESTORE',
  'REQUEST_CORRECTION',
];

/** Motif offensant / fraude → abus (priorité haute) ; sinon signalement de contenu standard. */
export function caseTypeForReason(reason: ReportReason): string {
  return reason === 'OFFENSIVE' || reason === 'FRAUD' ? 'ABUSE_REPORT' : 'CONTENT_REPORT';
}
