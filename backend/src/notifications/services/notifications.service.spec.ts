import { FollowTargetType, type Notification } from '@prisma/client';
import { FollowService } from '../../follow/follow.service';
import { DEFAULT_GLOBAL_SETTINGS, DEFAULT_USER_PREFERENCES } from '../domain/notification-routing';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsService, type PublishedEventTargets } from './notifications.service';

describe('NotificationsService — information Explorer (Follow → notification)', () => {
  let repository: jest.Mocked<Pick<NotificationRepository, 'create' | 'getUserPreferences'>>;
  let dispatcher: jest.Mocked<Pick<NotificationDispatcher, 'dispatch'>>;
  let follows: jest.Mocked<Pick<FollowService, 'listFollowerIds'>>;
  let settings: jest.Mocked<Pick<NotificationSettingsService, 'get'>>;
  let service: NotificationsService;

  const event: PublishedEventTargets = {
    id: 'e-1',
    title: 'Tournoi Magic',
    organizerId: 'org-1',
    activityId: 'act-1',
    subjectIds: ['subj-1'],
    venueId: null,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue({ id: 'n-1' } as Notification),
      getUserPreferences: jest.fn().mockResolvedValue({ ...DEFAULT_USER_PREFERENCES }),
    };
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
    follows = { listFollowerIds: jest.fn() };
    settings = { get: jest.fn().mockResolvedValue({ ...DEFAULT_GLOBAL_SETTINGS }) };
    service = new NotificationsService(
      repository as unknown as NotificationRepository,
      dispatcher as unknown as NotificationDispatcher,
      follows as unknown as FollowService,
      settings as unknown as NotificationSettingsService,
    );
  });

  it('notifie chaque abonné une seule fois (dédoublonnage entre types de cibles)', async () => {
    // u-1 suit l'organisateur ET l'activité → une seule notification. u-2 suit la catégorie.
    follows.listFollowerIds.mockImplementation((type: FollowTargetType) => {
      if (type === FollowTargetType.ORGANIZER) return Promise.resolve(['u-1']);
      if (type === FollowTargetType.ACTIVITY) return Promise.resolve(['u-1']);
      if (type === FollowTargetType.SUBJECT) return Promise.resolve(['u-2']);
      return Promise.resolve([]);
    });

    await service.notifyFollowersOfNewEvent(event);

    expect(repository.create).toHaveBeenCalledTimes(2);
    const recipients = repository.create.mock.calls.map((call) => call[0].userId).sort();
    expect(recipients).toEqual(['u-1', 'u-2']);
  });

  it("exclut l'auteur de la publication", async () => {
    follows.listFollowerIds.mockResolvedValue(['organizer-user', 'u-2']);
    await service.notifyFollowersOfNewEvent(event, 'organizer-user');
    const recipients = repository.create.mock.calls.map((call) => call[0].userId);
    expect(recipients).not.toContain('organizer-user');
  });

  it('best-effort : une erreur de diffusion ne remonte pas', async () => {
    follows.listFollowerIds.mockRejectedValue(new Error('db down'));
    await expect(service.notifyFollowersOfNewEvent(event)).resolves.toBeUndefined();
  });
});

describe('NotificationsService — notification technique « import prêt à valider » (workflow)', () => {
  let repository: jest.Mocked<
    Pick<NotificationRepository, 'create' | 'getUserPreferences' | 'findUserIdsWithPermission'>
  >;
  let dispatcher: jest.Mocked<Pick<NotificationDispatcher, 'dispatch'>>;
  let follows: jest.Mocked<Pick<FollowService, 'listFollowerIds'>>;
  let settings: jest.Mocked<Pick<NotificationSettingsService, 'get'>>;
  let service: NotificationsService;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue({ id: 'n-1' } as Notification),
      getUserPreferences: jest.fn().mockResolvedValue({ ...DEFAULT_USER_PREFERENCES }),
      findUserIdsWithPermission: jest.fn().mockResolvedValue(['op-1', 'op-2']),
    };
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
    follows = { listFollowerIds: jest.fn() };
    settings = { get: jest.fn().mockResolvedValue({ ...DEFAULT_GLOBAL_SETTINGS }) };
    service = new NotificationsService(
      repository as unknown as NotificationRepository,
      dispatcher as unknown as NotificationDispatcher,
      follows as unknown as FollowService,
      settings as unknown as NotificationSettingsService,
    );
  });

  it('aucun candidat créé → aucune notification (politique déterministe)', async () => {
    await service.notifyImportReadyForValidation('job-1', 0);
    expect(repository.findUserIdsWithPermission).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('candidats créés → crée un in-app IMPORTANT pour chaque opérateur `pipeline.manage`', async () => {
    await service.notifyImportReadyForValidation('job-1', 4);
    expect(repository.findUserIdsWithPermission).toHaveBeenCalledWith('pipeline.manage');
    const recipients = repository.create.mock.calls.map((call) => call[0].userId).sort();
    expect(recipients).toEqual(['op-1', 'op-2']);
    expect(repository.create.mock.calls[0][0].priority).toBe('IMPORTANT');
  });

  it('préférences par défaut (immédiat = aucun) → aucun envoi sortant immédiat (relève du récap)', async () => {
    await service.notifyImportReadyForValidation('job-1', 4);
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('opérateur ayant activé l’immédiat email → envoi sortant immédiat', async () => {
    repository.getUserPreferences.mockResolvedValue({
      ...DEFAULT_USER_PREFERENCES,
      immediate: 'email',
    });
    await service.notifyImportReadyForValidation('job-1', 4);
    expect(dispatcher.dispatch).toHaveBeenCalledTimes(2);
    expect(dispatcher.dispatch.mock.calls[0][1]).toEqual({ email: true, push: false });
  });

  it('best-effort : une erreur de ciblage ne remonte pas', async () => {
    repository.findUserIdsWithPermission.mockRejectedValue(new Error('db down'));
    await expect(service.notifyImportReadyForValidation('job-1', 2)).resolves.toBeUndefined();
  });
});
