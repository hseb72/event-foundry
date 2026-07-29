import type { MinioService } from '../../infra/minio/minio.service';
import type { EventMediaRepository } from '../repositories/event-media.repository';
import { EventMediaService } from './event-media.service';
import type { EventsService } from './events.service';

const image = (name = 'flyer.png'): Express.Multer.File =>
  ({
    originalname: name,
    mimetype: 'image/png',
    size: 1234,
    buffer: Buffer.from('x'),
  }) as unknown as Express.Multer.File;

describe('EventMediaService', () => {
  let repository: { create: jest.Mock; countByEvent: jest.Mock; findById: jest.Mock; delete: jest.Mock };
  let minio: { putObject: jest.Mock; copyObject: jest.Mock; presignedGetUrl: jest.Mock; removeObject: jest.Mock };
  let events: { getOrThrow: jest.Mock; getPrivateForEdit: jest.Mock };
  let service: EventMediaService;

  beforeEach(() => {
    repository = {
      create: jest.fn((data) => Promise.resolve({ id: 'm1', ...data })),
      countByEvent: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    minio = {
      putObject: jest.fn().mockResolvedValue(undefined),
      copyObject: jest.fn().mockResolvedValue(undefined),
      presignedGetUrl: jest.fn((key: string) => Promise.resolve(`https://minio/${key}`)),
      removeObject: jest.fn().mockResolvedValue(undefined),
    };
    events = {
      getOrThrow: jest.fn().mockResolvedValue({ id: 'e1' }),
      getPrivateForEdit: jest.fn().mockResolvedValue({ id: 'e1' }),
    };
    service = new EventMediaService(
      repository as unknown as EventMediaRepository,
      minio as unknown as MinioService,
      events as unknown as EventsService,
    );
  });

  describe('événement privé : la propriété tient lieu d’autorisation (FSPEC.22 §15)', () => {
    it('vérifie la propriété avant d’accepter l’image', async () => {
      await service.uploadToOwnPrivate('e1', 'user-1', image());

      expect(events.getPrivateForEdit).toHaveBeenCalledWith('e1', 'user-1');
      expect(minio.putObject).toHaveBeenCalled();
    });

    it('propage le refus de la garde de propriété sans rien stocker', async () => {
      events.getPrivateForEdit.mockRejectedValue(new Error('not found'));

      await expect(service.uploadToOwnPrivate('e1', 'intrus', image())).rejects.toThrow('not found');
      expect(minio.putObject).not.toHaveBeenCalled();
    });

    it('vérifie la propriété avant de retirer une image', async () => {
      repository.findById.mockResolvedValue({ id: 'm1', eventId: 'e1', objectKey: 'k' });

      await service.removeFromOwnPrivate('e1', 'm1', 'user-1');

      expect(events.getPrivateForEdit).toHaveBeenCalledWith('e1', 'user-1');
      expect(repository.delete).toHaveBeenCalledWith('m1');
    });
  });

  describe('reprise du document source d’un import', () => {
    const source = { objectKey: 'imports/a/flyer.png', contentType: 'image/png', sizeBytes: 42 };

    it('duplique l’objet et le pose en première position', async () => {
      await service.attachImportSource('e1', source);

      // Copie côté serveur : l'original de l'import n'est ni déplacé ni relu par l'application.
      expect(minio.copyObject).toHaveBeenCalledWith(
        'imports/a/flyer.png',
        expect.stringMatching(/^events\/e1\/media\//),
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'e1', position: 0, contentType: 'image/png' }),
      );
    });

    it('donne à chaque événement sa propre copie (une affiche décrivant plusieurs événements)', async () => {
      await service.attachImportSource('e1', source);
      await service.attachImportSource('e2', source);

      const [first, second] = minio.copyObject.mock.calls.map((call) => call[1] as string);
      expect(first).toContain('events/e1/media/');
      expect(second).toContain('events/e2/media/');
      expect(first).not.toEqual(second);
    });

    it('ignore un document qui n’est pas une image', async () => {
      await service.attachImportSource('e1', { ...source, contentType: 'application/pdf' });

      expect(minio.copyObject).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('n’invalide pas une validation acquise si le stockage échoue', async () => {
      minio.copyObject.mockRejectedValue(new Error('minio down'));

      await expect(service.attachImportSource('e1', source)).resolves.toBeUndefined();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
