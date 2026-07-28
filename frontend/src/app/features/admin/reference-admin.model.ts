/** Description déclarative des référentiels administrables (dirige le CRUD générique). */

export type FieldType = 'text' | 'url' | 'number' | 'select';

/** Source d'options d'un champ `select` (référentiel parent). */
export type OptionSource =
  | 'domains'
  | 'activities'
  | 'organizers'
  | 'countries'
  | 'regions'
  | 'activity-families'
  | 'modality-dimensions';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Pour un `select` : référentiel dont on tire les options (id/name). */
  optionsFrom?: OptionSource;
  /** Champ figé après création (ex. le parent d'une Activity), non modifiable en édition. */
  immutableOnEdit?: boolean;
}

export interface EntityDef {
  /** Segment d'URL de l'API (`/api/v1/<segment>`). */
  segment: string;
  /** Libellé pluriel affiché dans l'onglet. */
  label: string;
  /** Libellé singulier (boutons / formulaire). */
  singular: string;
  /** Champs éditables (le nom en premier). `isActive` est géré à part. */
  fields: FieldDef[];
}

const NAME: FieldDef = { key: 'name', label: 'Nom', type: 'text', required: true };

export const REFERENCE_ENTITIES: EntityDef[] = [
  {
    segment: 'domains',
    label: 'Domaines',
    singular: 'Domaine',
    fields: [NAME],
  },
  {
    segment: 'activities',
    label: 'Activités',
    singular: 'Activité',
    fields: [
      NAME,
      {
        key: 'domainId',
        label: 'Domaine',
        type: 'select',
        required: true,
        optionsFrom: 'domains',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'event-types',
    label: "Types d'événement",
    singular: "Type d'événement",
    fields: [
      NAME,
      {
        key: 'activityId',
        label: 'Activité',
        type: 'select',
        required: true,
        optionsFrom: 'activities',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'event-formats',
    label: 'Formats',
    singular: 'Format',
    fields: [
      NAME,
      {
        key: 'activityId',
        label: 'Activité',
        type: 'select',
        required: true,
        optionsFrom: 'activities',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'organizers',
    label: 'Organisateurs',
    singular: 'Organisateur',
    fields: [NAME, { key: 'website', label: 'Site web', type: 'url' }],
  },
  {
    segment: 'venues',
    label: 'Lieux',
    singular: 'Lieu',
    fields: [
      NAME,
      { key: 'organizerId', label: 'Organisateur', type: 'select', optionsFrom: 'organizers' },
      { key: 'address', label: 'Adresse', type: 'text' },
      { key: 'postalCode', label: 'Code postal', type: 'text' },
      { key: 'city', label: 'Ville', type: 'text' },
      { key: 'latitude', label: 'Latitude', type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
    ],
  },
  {
    segment: 'countries',
    label: 'Pays',
    singular: 'Pays',
    fields: [NAME, { key: 'code', label: 'Code ISO', type: 'text' }],
  },
  {
    segment: 'regions',
    label: 'Régions',
    singular: 'Région',
    fields: [
      NAME,
      {
        key: 'countryId',
        label: 'Pays',
        type: 'select',
        required: true,
        optionsFrom: 'countries',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'municipalities',
    label: 'Villes',
    singular: 'Ville',
    fields: [
      NAME,
      {
        key: 'regionId',
        label: 'Région',
        type: 'select',
        required: true,
        optionsFrom: 'regions',
        immutableOnEdit: true,
      },
      { key: 'postalCode', label: 'Code postal', type: 'text' },
    ],
  },
  {
    segment: 'categories',
    label: 'Catégories',
    singular: 'Catégorie',
    fields: [NAME],
  },
  {
    segment: 'tags',
    label: 'Tags',
    singular: 'Tag',
    fields: [NAME],
  },
  // DATA.01 v2.0 — Axe A (Family → Subject) et Axe C (ModalityDimension → Modality).
  {
    segment: 'activity-families',
    label: 'Familles',
    singular: 'Famille',
    fields: [
      NAME,
      {
        key: 'activityId',
        label: 'Activité',
        type: 'select',
        required: true,
        optionsFrom: 'activities',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'subjects',
    label: 'Sujets',
    singular: 'Sujet',
    fields: [
      NAME,
      {
        key: 'familyId',
        label: 'Famille',
        type: 'select',
        required: true,
        optionsFrom: 'activity-families',
        immutableOnEdit: true,
      },
    ],
  },
  {
    segment: 'modality-dimensions',
    label: 'Dimensions de modalité',
    singular: 'Dimension',
    fields: [NAME],
  },
  {
    segment: 'modalities',
    label: 'Modalités',
    singular: 'Modalité',
    fields: [
      NAME,
      {
        key: 'dimensionId',
        label: 'Dimension',
        type: 'select',
        required: true,
        optionsFrom: 'modality-dimensions',
        immutableOnEdit: true,
      },
    ],
  },
];
