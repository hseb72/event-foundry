import { BadRequestException, Injectable } from '@nestjs/common';
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
    if (!file) {
      throw new BadRequestException('Fichier manquant.');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new InvalidMediaTypeException(file.mimetype);
    }
    await this.events.getOrThrow(eventId); // 404 si l'Event n'existe pas

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

  async remove(eventId: string, mediaId: string): Promise<void> {
    const media = await this.repository.findById(mediaId);
    if (!media || media.eventId !== eventId) {
      throw new EventMediaNotFoundException(mediaId);
    }
    await this.minio.removeObject(media.objectKey);
    await this.repository.delete(mediaId);
  }
}
