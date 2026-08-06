/** Instantané des référentiels utilisé par le moteur expert (chargé hors PostgreSQL). */
export interface ReferenceActivity {
  id: string;
  name: string;
  domainId: string;
  aliases: string[];
}

/** EventType : référentiel **transverse** (DATA.01 v2.0), sans rattachement à une Activité. */
export interface ReferenceNamed {
  id: string;
  name: string;
}

/**
 * Famille (Axe A — DATA.01 v2.0) : maillon `Activity → Family → Subject`. Chargée non pour être
 * reconnue dans le texte, mais pour **remonter** d'un sujet détecté vers son activité.
 */
export interface ReferenceFamily {
  id: string;
  name: string;
  activityId: string;
}

/** Sujet (Axe A — DATA.01 v2.0). Reconnu par nom, indépendamment de l'activité détectée. */
export interface ReferenceSubject {
  id: string;
  name: string;
  /** Famille de rattachement : ouvre le chemin Subject → Family → Activity. */
  familyId: string;
}

/** Modalité (Axe C — DATA.01 v2.0). Référentiel transverse, reconnu par nom. */
export interface ReferenceModality {
  id: string;
  name: string;
}

export interface ReferenceOrganizer {
  id: string;
  name: string;
}

export interface ReferenceVenue {
  id: string;
  name: string;
  city: string | null;
}

export interface ReferenceSnapshot {
  activities: ReferenceActivity[];
  eventTypes: ReferenceNamed[];
  families: ReferenceFamily[];
  subjects: ReferenceSubject[];
  modalities: ReferenceModality[];
  organizers: ReferenceOrganizer[];
  venues: ReferenceVenue[];
}

export const EMPTY_SNAPSHOT: ReferenceSnapshot = {
  activities: [],
  eventTypes: [],
  families: [],
  subjects: [],
  modalities: [],
  organizers: [],
  venues: [],
};
