/**
 * Contrôles automatiques de soumission (FSPEC.22 §13). Chaîne de règles **100 % déterministes**
 * (règle d'or n°1 : aucune décision métier fondée sur un LLM, aucune liste métier codée en dur) —
 * même esprit que le moteur expert (ADR.06). Chaque contrôle a une responsabilité unique, ne connaît
 * pas les autres et renvoie une anomalie ou `null`. Si au moins une anomalie est détectée, la
 * validation est retenue et une Case est ouverte (§14) sans bloquer les autres Drafts (ESUB-004/006).
 *
 * Les contrôles nécessitant un référentiel (contenu interdit, spam) seront branchés ici lorsqu'un
 * référentiel de modération existera — sans jamais coder la liste en dur.
 */

/** Nature d'une anomalie détectée (oriente le type de Case et le message). */
export type SubmissionAnomalyKind = 'DATE_COHERENCE' | 'DUPLICATE';

export interface SubmissionAnomaly {
  kind: SubmissionAnomalyKind;
  /** Message lisible destiné à l'auteur et à l'Operator. */
  message: string;
}

/** Données observées par les contrôles (extraites de l'Event à créer + contexte de duplication). */
export interface SubmissionControlContext {
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  /** Vrai si un doublon a été trouvé au catalogue public (calculé en amont, hors contrôle pur). */
  hasPublicDuplicate: boolean;
  /** Le contrôle de doublon ne s'applique qu'aux événements destinés au catalogue public. */
  checkDuplicate: boolean;
}

type SubmissionControl = (context: SubmissionControlContext) => SubmissionAnomaly | null;

/** Cohérence des dates : une date de fin ne peut précéder la date de début (§13 « incohérentes »). */
const dateCoherenceControl: SubmissionControl = (context) => {
  if (context.endsAt && context.endsAt.getTime() < context.startsAt.getTime()) {
    return { kind: 'DATE_COHERENCE', message: 'La date de fin précède la date de début.' };
  }
  return null;
};

/**
 * Doublon au catalogue public : un événement public identique (titre + date de début) existe déjà.
 * Ne s'applique qu'au chemin publiable — un événement privé Explorer est une copie personnelle
 * légitime (la notification d'un Organizer déjà enregistré relève de §16, pas de la modération).
 */
const duplicateControl: SubmissionControl = (context) => {
  if (context.checkDuplicate && context.hasPublicDuplicate) {
    return {
      kind: 'DUPLICATE',
      message: 'Un événement public identique (même titre, même date) existe déjà.',
    };
  }
  return null;
};

/** Chaîne de contrôles, activables / réordonnables sans modifier l'appelant. */
const CONTROLS: SubmissionControl[] = [dateCoherenceControl, duplicateControl];

/** Exécute la chaîne et retourne toutes les anomalies détectées (vide si le Draft est conforme). */
export function detectSubmissionAnomalies(context: SubmissionControlContext): SubmissionAnomaly[] {
  return CONTROLS.map((control) => control(context)).filter(
    (anomaly): anomaly is SubmissionAnomaly => anomaly !== null,
  );
}
