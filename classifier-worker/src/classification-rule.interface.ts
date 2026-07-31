import type {
  ClassificationDiagnostic,
  ConfidenceByField,
  ExtractedEventFields,
  OCRResult,
} from '@event-foundry/contracts';
import type { ReferenceSnapshot } from './reference/reference-snapshot';

/**
 * Contexte partagé par toutes les règles du moteur expert (TSPEC.05).
 * Chaque règle lit les données utiles et enrichit le contexte sans modifier le travail
 * des autres règles. Le contexte n'est jamais exposé hors du Worker.
 */
export interface ClassificationContext {
  ocr: OCRResult;
  /** Texte OCR normalisé (minuscules, sans accents) pour la reconnaissance. */
  normalizedText: string;
  reference: ReferenceSnapshot;
  extractedFields: ExtractedEventFields;
  confidenceByField: ConfidenceByField;
  diagnostics: ClassificationDiagnostic[];
}

/**
 * Interface commune à toutes les règles de classification (ADR.06). Le moteur orchestre
 * une collection de règles indépendantes ; il ne dépend jamais d'une règle concrète.
 * Aucune donnée métier n'est codée en dur : toute connaissance provient des référentiels.
 */
export interface ClassificationRule {
  /** Identifiant lisible de la règle (ex. « DateRule »), utilisé pour les diagnostics. */
  readonly name: string;
  execute(context: ClassificationContext): Promise<void>;
}
