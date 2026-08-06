/**
 * Proposition d'ajout au référentiel (FSPEC.21 — type de Case `REFERENCE_SUGGESTION`).
 *
 * Quand le moteur d'analyse extrait un libellé qui n'existe pas au référentiel, l'utilisateur ne
 * peut ni le créer (droit `reference.manage` réservé) ni l'ignorer sans perdre l'information. Il
 * **propose** l'ajout : une Case part vers la modération, qui accepte, corrige ou refuse. Le
 * référentiel reste ainsi gouverné, sans que la soumission en cours soit interrompue.
 */

/** Référentiels sur lesquels une proposition peut porter. */
export const REFERENCE_KINDS = ['ACTIVITY', 'EVENT_TYPE', 'SUBJECT', 'ORGANIZER', 'VENUE'] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

/** Libellés lisibles, utilisés dans le sujet de la Case et dans la console Operator. */
export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  ACTIVITY: 'Activité',
  EVENT_TYPE: "Type d'événement",
  SUBJECT: 'Sujet',
  ORGANIZER: 'Organisateur',
  VENUE: 'Lieu',
};

/**
 * Référentiels dont la création exige un parent : une Activité appartient à un Domain, un Sujet à
 * une Family. La modération choisit ce parent au moment d'accepter — le proposant n'a pas à
 * connaître la hiérarchie.
 */
export const REFERENCE_PARENT_OF: Partial<Record<ReferenceKind, 'DOMAIN' | 'FAMILY'>> = {
  ACTIVITY: 'DOMAIN',
  SUBJECT: 'FAMILY',
};

/** Proposition telle que portée par la Case, puis telle que tranchée par la modération. */
export interface ReferenceSuggestion {
  kind: ReferenceKind;
  /** Libellé proposé, tel qu'extrait du document (la modération peut le corriger). */
  label: string;
  /** Domaine (Activité) ou Famille (Sujet) de rattachement. Absent à l'ouverture. */
  parentId?: string;
  /** Extrait du document ou titre de l'événement en cours : de quoi juger sur pièces. */
  context?: string;
}

/** Métadonnées portées par une Case `REFERENCE_SUGGESTION`. */
export interface ReferenceSuggestionMetadata {
  suggestion: ReferenceSuggestion;
  /** Identifiant de la référence créée à l'acceptation — trace la décision. */
  createdReferenceId?: string;
  /** Identifiant de l'alias créé, quand la proposition s'est révélée être un simple libellé. */
  createdAliasId?: string;
}

export function isReferenceKind(value: string): value is ReferenceKind {
  return (REFERENCE_KINDS as readonly string[]).includes(value);
}

/** Sujet de la Case : lisible d'un coup d'œil dans la file de modération. */
export function suggestionSubject(kind: ReferenceKind, label: string): string {
  return `Ajout au référentiel — ${REFERENCE_KIND_LABELS[kind]} « ${label} »`;
}
