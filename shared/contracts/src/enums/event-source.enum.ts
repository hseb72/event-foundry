/**
 * Provenance d'un Event. Calculée, figée à la création, non modifiable par le client.
 * Référence : ARCHI.03, ARCHI.04, FSPEC.03.
 */
export enum EventSource {
  IMPORT = 'IMPORT',
  MANUAL = 'MANUAL',
}
