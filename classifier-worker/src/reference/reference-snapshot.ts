/** Instantané des référentiels utilisé par le moteur expert (chargé hors PostgreSQL). */
export interface ReferenceActivity {
  id: string;
  name: string;
  domainId: string;
  aliases: string[];
}

export interface ReferenceNamed {
  id: string;
  name: string;
  activityId: string;
}

/** Format d'événement : référentiel **transverse** (DATA.01 §4), sans rattachement à une Activité. */
export interface ReferenceFormat {
  id: string;
  name: string;
}

/** Sujet (Axe A — DATA.01 v2.0). Reconnu par nom, indépendamment de l'activité détectée. */
export interface ReferenceSubject {
  id: string;
  name: string;
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
  eventFormats: ReferenceFormat[];
  subjects: ReferenceSubject[];
  modalities: ReferenceModality[];
  organizers: ReferenceOrganizer[];
  venues: ReferenceVenue[];
}

export const EMPTY_SNAPSHOT: ReferenceSnapshot = {
  activities: [],
  eventTypes: [],
  eventFormats: [],
  subjects: [],
  modalities: [],
  organizers: [],
  venues: [],
};
