import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MinioService } from '../../infra/minio/minio.service';
import { EventMediaDto } from '../dto/event-media.dto';
import {
  EventMediaNotFoundException,
  InvalidMediaTypeException,
} from '../exceptions/event-validation.exceptions';
import { EventMediaRepository } from '../repositories/event-media.repository';
import { EventsService } from './events.service';

/** Gère les médias (images) d'un Event : upload MinIO + métadonnées en base (ARCHI.01). */
@Injectable()
export class EventMediaService {
  private readonly logger = new Logger(EventMediaService.name);

  constructor(
    private readonly repository: EventMediaRepository,
    private readonly minio: MinioService,
    private readonly events: EventsService,
  ) {}

  /** Liste les médias d'un Event avec des URL de lecture temporaires (présignées). */
  async listWithUrls(eventId: string): Promise<EventMediaDto[]> {
    const rows = await this.repository.listByEvent(eventId);
    return Promise.all(
      rows.map(async (media) => ({
        id: media.id,
        url: await this.minio.presignedGetUrl(media.objectKey),
        contentType: media.contentType,
        position: media.position,
      })),
    );
  }

  async upload(eventId: string, file: Express.Multer.File | undefined): Promise<EventMediaDto> {
    await this.events.getOrThrow(eventId); // 404 si l'Event n'existe pas
    return this.store(eventId, file);
  }

  /**
   * Ajout d'une image à **son propre** événement privé (FSPEC.22 §15). Un événement privé est une
   * donnée personnelle : son propriétaire l'illustre sans détenir `event.update`, droit réservé à la
   * curation du catalogue. La garde de propriété y remplace la permission.
   */
  async uploadToOwnPrivate(
    eventId: string,
    userId: string,
    file: Express.Multer.File | undefined,
  ): Promise<EventMediaDto> {
    await this.events.getPrivateForEdit(eventId, userId);
    return this.store(eventId, file);
  }

  private async store(
    eventId: string,
    file: Express.Multer.File | undefined,
  ): Promise<EventMediaDto> {
    if (!file) {
      throw new BadRequestException('Fichier manquant.');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new InvalidMediaTypeException(file.mimetype);
    }

    const objectKey = `events/${eventId}/media/${randomUUID()}`;
    await this.minio.putObject(objectKey, file.buffer, file.mimetype);

    const position = await this.repository.countByEvent(eventId);
    const media = await this.repository.create({
      eventId,
      objectKey,
      contentType: file.mimetype,
      sizeBytes: file.size,
      position,
    });

    return {
      id: media.id,
      url: await this.minio.presignedGetUrl(media.objectKey),
      contentType: media.contentType,
      position: media.position,
    };
  }

  /**
   * Reprend le **document source d'un import** comme première image de l'événement qui en est issu.
   *
   * Une affiche décrivant plusieurs événements les illustre tous : chaque événement validé depuis ce
   * document reçoit donc sa propre copie, en position 0. L'objet est dupliqué côté MinIO plutôt que
   * référencé — l'original de l'import reste intact et indépendant du cycle de vie de l'événement
   * (conservation & traçabilité), et retirer l'image d'un événement n'atteint ni le document
   * d'origine, ni les autres événements issus du même document.
   *
   * Best-effort : un stockage indisponible ne doit pas invalider une validation déjà acquise.
   */
  async attachImportSource(
    eventId: string,
    source: { objectKey: string; contentType: string; sizeBytes: number },
  ): Promise<void> {
    if (!source.contentType.startsWith('image/')) {
      return; // Un PDF ou un texte importé ne fait pas une couverture.
    }
    try {
      const objectKey = `events/${eventId}/media/${randomUUID()}`;
      await this.minio.copyObject(source.objectKey, objectKey);
      await this.repository.create({
        eventId,
        objectKey,
        contentType: source.contentType,
        sizeBytes: source.sizeBytes,
        position: 0,
      });
    } catch (error) {
      this.logger.warn(
        `Image source non reprise pour l'événement ${eventId} : ${(error as Error).message}`,
      );
    }
  }

  async remove(eventId: string, mediaId: string): Promise<void> {
    await this.deleteMedia(eventId, mediaId);
  }

  /** Retrait d'une image de **son propre** événement privé — même garde de propriété que l'ajout. */
  async removeFromOwnPrivate(eventId: string, mediaId: string, userId: string): Promise<void> {
    await this.events.getPrivateForEdit(eventId, userId);
    await this.deleteMedia(eventId, mediaId);
  }

  private async deleteMedia(eventId: string, mediaId: string): Promise<void> {
    const media = await this.repository.findById(mediaId);
    if (!media || media.eventId !== eventId) {
      throw new EventMediaNotFoundException(mediaId);
    }
    await this.minio.removeObject(media.objectKey);
    await this.repository.delete(mediaId);
  }
}
