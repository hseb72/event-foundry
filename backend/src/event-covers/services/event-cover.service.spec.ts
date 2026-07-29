import type { EventMedia } from '@prisma/client';
import type { MinioService } from '../../infra/minio/minio.service';
import type { EventCoverRepository } from '../repositories/event-cover.repository';
import { EventCoverService } from './event-cover.service';

const media = (eventId: string, position: number, objectKey: string): EventMedia =>
  ({ id: `${eventId}-${position}`, eventId, position, objectKey }) as unknown as EventMedia;

describe('EventCoverService — couverture des vues en liste', () => {
  let repository: { listImagesByEvents: jest.Mock };
  let minio: { presignedGetUrl: jest.Mock };
  let service: EventCoverService;

  beforeEach(() => {
    repository = { listImagesByEvents: jest.fn().mockResolvedValue([]) };
    minio = { presignedGetUrl: jest.fn((key: string) => Promise.resolve(`https://minio/${key}?sig`)) };
    service = new EventCoverService(
      repository as unknown as EventCoverRepository,
      minio as unknown as MinioService,
    );
  });

  it('retient la première image de chaque événement (position croissante)', async () => {
    repository.listImagesByEvents.mockResolvedValue([
      media('a', 0, 'events/a/cover'),
      media('a', 1, 'events/a/second'),
      media('b', 0, 'events/b/cover'),
    ]);
    const targets = [
      { id: 'a', coverUrl: null },
      { id: 'b', coverUrl: null },
    ];

    await service.attach(targets);

    expect(targets[0].coverUrl).toBe('https://minio/events/a/cover?sig');
    expect(targets[1].coverUrl).toBe('https://minio/events/b/cover?sig');
    // Seule la couverture est présignée : la seconde image d'un même événement est ignorée.
    expect(minio.presignedGetUrl).toHaveBeenCalledTimes(2);
  });

  it('laisse `null` un événement sans image (l’interface applique son dégradé de repli)', async () => {
    repository.listImagesByEvents.mockResolvedValue([media('a', 0, 'events/a/cover')]);
    const targets = [
      { id: 'a', coverUrl: null },
      { id: 'sans-image', coverUrl: null },
    ];

    await service.attach(targets);

    expect(targets[1].coverUrl).toBeNull();
  });

  it('interroge la base une seule fois pour toute la page', async () => {
    repository.listImagesByEvents.mockResolvedValue([]);

    await service.attach([
      { id: 'a', coverUrl: null },
      { id: 'b', coverUrl: null },
      { id: 'c', coverUrl: null },
    ]);

    expect(repository.listImagesByEvents).toHaveBeenCalledTimes(1);
    expect(repository.listImagesByEvents).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('ne fait aucun appel sur une liste vide', async () => {
    await service.attach([]);

    expect(repository.listImagesByEvents).not.toHaveBeenCalled();
  });
});
