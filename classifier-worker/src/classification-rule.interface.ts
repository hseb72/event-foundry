import type {
  ClassificationDiagnostic,
  ConfidenceByField,
  ExtractedEventFields,
  OCRResult,
} from '@event-foundry/contracts';

/**
 * Contexte partagé par toutes les règles du moteur expert.
 * Chaque règle lit les données utiles et enrichit le contexte sans modifier le travail
 * des autres règles. Le contexte n'est jamais exposé hors du Worker (TSPEC.05).
 */
export interface ClassificationContext {
  ocr: OCRResult;
  extractedFields: ExtractedEventFields;
  confidenceByField: ConfidenceByField;
  diagnostics: ClassificationDiagnostic[];
}

/**
 * Interface commune à toutes les règles de classification (ADR.06).
 * Le moteur orchestre uniquement une collection de règles indépendantes ; il ne dépend
 * jamais d'une règle concrète (DateRule, VenueRule...). Aucune donnée métier n'est codée
 * en dur : toute connaissance provient des référentiels.
 */
export interface ClassificationRule {
  /** Identifiant lisible de la règle (ex. "DateRule"), utilisé pour les diagnostics. */
  readonly name: string;
  execute(context: ClassificationContext): Promise<void>;
}
