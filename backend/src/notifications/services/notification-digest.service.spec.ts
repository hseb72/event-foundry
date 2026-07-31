import { type Notification } from '@prisma/client';
import { DEFAULT_GLOBAL_SETTINGS, DEFAULT_USER_PREFERENCES } from '../domain/notification-routing';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDigestService } from './notification-digest.service';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationSettingsService } from './notification-settings.service';

const note = (id: string, userId: string): Notification => ({ id, userId }) as Notification;

describe('NotificationDigestService — planificateur de récaps (idempotence RG-NOTIF-05)', () => {
  let repository: jest.Mocked<
    Pick<NotificationRepository, 'findPendingForDigest' | 'getUserPreferences' | 'create' | 'markDigested'>
  >;
  let dispatcher: jest.Mocked<Pick<NotificationDispatcher, 'dispatch'>>;
  let settings: jest.Mocked<Pick<NotificationSettingsService, 'get'>>;
  let service: NotificationDigestService;

  beforeEach(() => {
    repository = {
      findPendingForDigest: jest.fn(),
      getUserPreferences: jest.fn().mockResolvedValue({ ...DEFAULT_USER_PREFERENCES }),
      create: jest.fn().mockResolvedValue(note('digest-1', 'u-1')),
      markDigested: jest.fn().mockResolvedValue(undefined),
    };
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
    settings = { get: jest.fn().mockResolvedValue({ ...DEFAULT_GLOBAL_SETTINGS }) };
    service = new NotificationDigestService(
      repository as unknown as NotificationRepository,
      dispatcher as unknown as NotificationDispatcher,
      settings as unknown as NotificationSettingsService,
    );
  });

  it('aucune notification en attente → passage sans effet', async () => {
    repository.findPendingForDigest.mockResolvedValue([]);
    const stats = await service.runDigest('weekly');
    expect(stats).toEqual({ track: 'weekly', recipients: 0, delivered: 0, notifications: 0 });
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.markDigested).not.toHaveBeenCalled();
  });

  it('vecteur actif → agrège par destinataire, diffuse un récap, puis marque diffusé', async () => {
    // weekly = email par défaut. u-1 a deux notifs, u-2 une.
    repository.findPendingForDigest.mockResolvedValue([
      note('n-1', 'u-1'),
      note('n-2', 'u-1'),
      note('n-3', 'u-2'),
    ]);
    const stats = await service.runDigest('weekly');

    expect(stats).toEqual({ track: 'weekly', recipients: 2, delivered: 2, notifications: 3 });
    // Un récap par destinataire (agrégation).
    expect(repository.create).toHaveBeenCalledTimes(2);
    expect(repository.create.mock.calls[0][0].type).toBe('DIGEST_WEEKLY');
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(2);
    expect(dispatcher.dispatch.mock.calls[0][1]).toEqual({ email: true, push: false });
    // Idempotence : les notifs de chaque destinataire sont marquées pour la piste.
    expect(repository.markDigested).toHaveBeenCalledWith('weekly', ['n-1', 'n-2']);
    expect(repository.markDigested).toHaveBeenCalledWith('weekly', ['n-3']);
  });

  it('destinataire sans vecteur pour la piste → consommé sans diffusion', async () => {
    repository.getUserPreferences.mockResolvedValue({ ...DEFAULT_USER_PREFERENCES, weekly: 'none' });
    repository.findPendingForDigest.mockResolvedValue([note('n-1', 'u-1')]);
    const stats = await service.runDigest('weekly');

    expect(stats.delivered).toBe(0);
    expect(repository.create).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
    // Marqué quand même → borne le backlog (l'in-app conserve l'historique).
    expect(repository.markDigested).toHaveBeenCalledWith('weekly', ['n-1']);
  });

  it('best-effort : une erreur sur un destinataire n’interrompt pas les autres', async () => {
    repository.findPendingForDigest.mockResolvedValue([note('n-1', 'u-1'), note('n-2', 'u-2')]);
    repository.getUserPreferences.mockImplementation((userId: string) =>
      userId === 'u-1'
        ? Promise.reject(new Error('db down'))
        : Promise.resolve({ ...DEFAULT_USER_PREFERENCES }),
    );
    const stats = await service.runDigest('weekly');

    expect(stats.delivered).toBe(1);
    expect(repository.markDigested).toHaveBeenCalledWith('weekly', ['n-2']);
  });
});
