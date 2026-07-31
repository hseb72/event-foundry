/**
 * Raw Event — contrat officiel connecteur ↔ pipeline (ADR.15 / TSPEC.01).
 *
 * Représentation **fidèle et immuable** des données d'une source externe, produite par la phase
 * d'extraction d'un connecteur. Le domaine métier ne le manipule jamais directement : seule la phase
 * de **normalisation** du pipeline le projette vers le modèle commun. Conservé pour le rejeu, le
 * diagnostic et l'audit (RG-IMP-02/03/04).
 *
 * Règle d'or maintenue : un connecteur *extrait*, il ne décide jamais (aucune validation,
 * normalisation, catégorisation ni recommandation dans le Raw Event — ADR.15 §Neutralité).
 */
export interface RawEvent {
  /** Identifiant plateforme (UUID généré côté application). */
  id: string;
  importJobId: string;
  /** Identifiant du connecteur d'origine (traçabilité). */
  providerId: string;
  /** Identifiant natif chez le fournisseur, s'il existe — clé de rapprochement (déduplication). */
  providerKey: string | null;
  /** Version du connecteur ayant produit ce Raw Event (traçabilité — RG-IMP-04). */
  connectorVersion: string;
  /** Date d'acquisition (ISO 8601 UTC). */
  acquiredAt: string;
  /** Représentation FIDÈLE des données source (aucune normalisation). */
  payload: Record<string, unknown>;
  /** Clés MinIO des médias/documents source (jamais le binaire en base). */
  mediaRefs: string[];
  correlationId: string;
}
