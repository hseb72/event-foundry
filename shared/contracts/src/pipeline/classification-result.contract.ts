import type { OCRResult } from './ocr-result.contract';

/**
 * Résultat produit par le Classifier Worker (moteur expert déterministe).
 * Aucune écriture Event n'est réalisée par le Worker : le Backend transforme ce
 * résultat en EventCandidate.
 * Référence : TSPEC.03, TSPEC.05.
 */

/**
 * Champs d'événement détectés par le moteur expert.
 * Le `domain` n'y figure jamais : il est déduit de l'`activity` par le Backend.
 * Les dates sont des chaînes ISO 8601 en UTC.
 */
export interface ExtractedEventFields {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  price?: number;
  currency?: string;
  activity?: string;
  eventType?: string;
  eventFormat?: string;
  organizer?: string;
  venue?: string;
  city?: string;
  url?: string;
}

/** Un score de confiance (0..1) par champ détecté. Aucun score global. */
export type ConfidenceByField = Partial<Record<keyof ExtractedEventFields, number>>;

export type ClassificationDiagnosticLevel = 'INFO' | 'WARNING' | 'ERROR';

/** Avertissement, ambiguïté ou erreur de reconnaissance, pour faciliter la revue. */
export interface ClassificationDiagnostic {
  /** Règle émettrice (ex. "DateRule"). */
  rule: string;
  level: ClassificationDiagnosticLevel;
  message: string;
  field?: keyof ExtractedEventFields;
}

export interface ClassificationResult {
  importJobId: string;
  extractedFields: ExtractedEventFields;
  confidenceByField: ConfidenceByField;
  diagnostics: ClassificationDiagnostic[];
  /**
   * OCRResult source (provenance complète : texte + métadonnées moteur/langue/durée…).
   * Repropagé jusqu'au Backend pour conservation sur l'`ImportJob`, car les Workers
   * n'accèdent jamais à PostgreSQL. Assure la traçabilité et la rejouabilité du pipeline
   * (règle d'or 9), y compris la comparaison des versions du moteur OCR. Pour un import
   * texte, c'est l'OCRResult de substitution (engine `text-passthrough`).
   */
  ocr: OCRResult;
  correlationId: string;
}
