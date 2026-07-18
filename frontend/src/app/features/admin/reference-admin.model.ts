/** Description déclarative des référentiels administrables (dirige le CRUD générique). */

export type FieldType = 'text' | 'url' | 'number' | 'select';

/** Source d'options d'un champ `select` (référentiel parent). */
export type OptionSource = 'domains' | 'activities' | 'organizers';

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
];
