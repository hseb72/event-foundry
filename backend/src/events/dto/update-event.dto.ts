import { CreateEventDto } from './create-event.dto';

/**
 * Données éditables d'un Event lors d'une correction (FSPEC.13 « Modifié »). Mêmes champs que la
 * création (sémantique de remplacement complet du formulaire) : la provenance (source) et le
 * statut ne sont jamais envoyés ni modifiés. Seuls les brouillons / événements soumis sont éditables.
 */
export class UpdateEventDto extends CreateEventDto {}
