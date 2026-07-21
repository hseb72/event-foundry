import type { ImportChannel } from '@prisma/client';

/**
 * Port des connecteurs d'import (ADR.13). Un fournisseur = un connecteur ; aucune modification du
 * cœur pour en ajouter un (résolution par `providerId` via le registry `IMPORT_CONNECTORS`).
 *
 * Règle d'or maintenue : un connecteur *extrait* uniquement — il ne valide, ne normalise, ne
 * déduplique, ne persiste ni ne recommande jamais (ADR.15 §Neutralité). Il ne produit que des
 * ébauches de Raw Event ; le pipeline commun se charge du reste.
 */
export interface ImportConnector {
  /** Identifiant unique du fournisseur (traçabilité Raw Event). */
  readonly providerId: string;
  /** Version du connecteur (conservée sur chaque Raw Event — RG-IMP-04). */
  readonly version: string;
  /** Canal d'acquisition servi par ce connecteur. */
  readonly channel: ImportChannel;

  describe(): ConnectorDescriptor;

  /**
   * Produit des ébauches de Raw Event à partir d'un contenu fourni (upload / copier-coller).
   * Déterministe pour les canaux structurés (CSV/JSON) : ni OCR ni IA. Lève une erreur de parsing
   * explicite si le contenu est illisible (le pipeline la traduit en échec d'import).
   */
  extract(input: ConnectorExtractInput): RawEventDraft[];
}

/** Capacités et attentes de configuration d'un connecteur (guidage UI / documentation). */
export interface ConnectorDescriptor {
  providerId: string;
  label: string;
  channel: ImportChannel;
  /** Formats de contenu acceptés (types MIME ou libellés). */
  accepts: string[];
  /** Résumé du schéma attendu (documentation du canal). */
  schemaSummary: string;
  /** Le canal requiert-il de l'IA (extraction) ? Toujours false pour les canaux déterministes. */
  requiresAi: boolean;
}

/** Entrée d'extraction : le contenu brut fourni par l'utilisateur (paste ou fichier décodé). */
export interface ConnectorExtractInput {
  /** Contenu textuel de la source (CSV, JSON…). */
  content: string;
  /** Type MIME d'origine, s'il est connu. */
  contentType?: string | null;
}

/**
 * Ébauche de Raw Event produite par un connecteur : la partie **fidèle** (clé native + payload
 * source). Le pipeline complète l'identité (UUID, importJobId, version, dates, correlationId).
 */
export interface RawEventDraft {
  /** Identifiant natif chez le fournisseur, s'il existe (clé de rapprochement). */
  providerKey: string | null;
  /** Représentation fidèle de l'objet source (aucune normalisation). */
  payload: Record<string, unknown>;
  /** Clés MinIO des médias source, le cas échéant. */
  mediaRefs?: string[];
}

/** Token d'injection du registry de connecteurs (ADR.13). */
export const IMPORT_CONNECTORS = Symbol('IMPORT_CONNECTORS');
