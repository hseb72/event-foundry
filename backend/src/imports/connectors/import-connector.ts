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
   * Produit des ébauches de Raw Event à partir d'un contenu fourni (upload / copier-coller / page).
   * Synchrone et déterministe pour les canaux structurés (CSV/JSON) ; asynchrone pour les canaux à
   * I/O (extraction IA — ADR.14 : la phase Extract peut être longue). Lève une erreur de parsing
   * explicite si le contenu est illisible (le pipeline la traduit en échec d'import).
   */
  extract(input: ConnectorExtractInput): RawEventDraft[] | Promise<RawEventDraft[]>;
}

/**
 * Assistant IA résolu, passé au connecteur d'extraction par le Backend (le connecteur ne résout
 * jamais les secrets — ADR.21). Absent = pas d'IA disponible pour ce canal.
 */
export interface ExtractionAssistant {
  provider: string;
  model: string;
  apiKey: string;
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
  /** Contenu textuel de la source (CSV, JSON, texte libre, HTML…). Vide pour une source image. */
  content: string;
  /** Type MIME d'origine, s'il est connu. */
  contentType?: string | null;
  /** Assistant IA résolu (canaux assistés par IA uniquement — ADR.16). Absent = pas d'IA. */
  assistant?: ExtractionAssistant;
  /** Image source (extraction IA vision — affiche/photo). Prioritaire sur `content` si présente. */
  image?: { base64: string; mediaType: string };
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
