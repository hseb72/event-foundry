import { Injectable } from '@nestjs/common';
import { MinioService } from '../../infra/minio/minio.service';
import { EventCoverRepository } from '../repositories/event-cover.repository';

/** Objet portant une couverture : toute réponse d'Event exposée en liste ou en fiche. */
interface CoverTarget {
  id: string;
  coverUrl: string | null;
}

/**
 * Couverture illustrée d'un Event pour les **vues en liste** (Découverte, page de garde, planning,
 * « Nos événements », « Mes événements privés »…).
 *
 * La galerie complète (`media`) reste réservée à la fiche détaillée : présigner toutes les images
 * de toutes les lignes d'une page serait payé pour rien, une carte n'en affichant qu'une. Ce service
 * ne résout donc que **la première image** de chaque événement, en une seule requête pour toute la
 * page.
 */
@Injectable()
export class EventCoverService {
  constructor(
    private readonly repository: EventCoverRepository,
    private readonly minio: MinioService,
  ) {}

  /**
   * Renseigne `coverUrl` sur chaque élément fourni. Les événements sans image gardent `null` :
   * l'interface applique alors son dégradé de repli (UISPEC.13).
   */
  async attach(targets: CoverTarget[]): Promise<void> {
    if (!targets.length) {
      return;
    }
    const rows = await this.repository.listImagesByEvents(targets.map((t) => t.id));
    if (!rows.length) {
      return;
    }
    // Les lignes arrivent triées par position : la première rencontrée pour un événement est sa couverture.
    const firstByEvent = new Map<string, string>();
    for (const row of rows) {
      if (!firstByEvent.has(row.eventId)) {
        firstByEvent.set(row.eventId, row.objectKey);
      }
    }
    const urls = new Map<string, string>();
    await Promise.all(
      [...firstByEvent].map(async ([eventId, objectKey]) => {
        urls.set(eventId, await this.minio.presignedGetUrl(objectKey));
      }),
    );
    for (const target of targets) {
      target.coverUrl = urls.get(target.id) ?? null;
    }
  }
}
