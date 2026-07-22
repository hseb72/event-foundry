import { DOMAIN_EVENTS } from '../../platform/event-bus/domain-event';
import type {
  EventPublishedPayload,
  ImportCompletedPayload,
} from '../../platform/event-bus/domain-event';
import { InProcessEventBus } from '../../platform/event-bus/in-process-event-bus';
import { makeDomainEvent } from '../../platform/event-bus/event-bus';
import { NotificationEventSubscriber } from './notification-event.subscriber';
import type { NotificationsService } from './notifications.service';

describe('NotificationEventSubscriber — pilotage des notifications par le bus (RG-NOTIF-01)', () => {
  let bus: InProcessEventBus;
  let notifications: jest.Mocked<
    Pick<NotificationsService, 'notifyImportReadyForValidation' | 'notifyFollowersOfNewEvent'>
  >;
  let subscriber: NotificationEventSubscriber;

  beforeEach(() => {
    bus = new InProcessEventBus();
    notifications = {
      notifyImportReadyForValidation: jest.fn().mockResolvedValue(undefined),
      notifyFollowersOfNewEvent: jest.fn().mockResolvedValue(undefined),
    };
    subscriber = new NotificationEventSubscriber(bus, notifications as unknown as NotificationsService);
    subscriber.onModuleInit();
  });

  it('import.completed → notifie les opérateurs du pipeline (délégation avec volumétrie)', async () => {
    const payload: ImportCompletedPayload = {
      importJobId: 'job-1',
      channel: 'csv',
      providerId: 'p-1',
      createdCount: 3,
      duplicateCount: 1,
      rejectedCount: 0,
    };
    await bus.publish(makeDomainEvent<ImportCompletedPayload>(DOMAIN_EVENTS.IMPORT_COMPLETED, payload));

    expect(notifications.notifyImportReadyForValidation).toHaveBeenCalledWith('job-1', 3);
  });

  it('event.published (première publication) → notifie les abonnés Follow', async () => {
    const payload: EventPublishedPayload = {
      eventId: 'e-1',
      title: 'Tournoi Magic',
      actorId: 'u-org',
      firstPublish: true,
      organizerId: 'org-1',
      activityId: 'act-1',
      categoryId: 'cat-1',
      venueId: null,
    };
    await bus.publish(makeDomainEvent<EventPublishedPayload>(DOMAIN_EVENTS.EVENT_PUBLISHED, payload));

    expect(notifications.notifyFollowersOfNewEvent).toHaveBeenCalledWith(
      {
        id: 'e-1',
        title: 'Tournoi Magic',
        organizerId: 'org-1',
        activityId: 'act-1',
        categoryId: 'cat-1',
        venueId: null,
      },
      'u-org',
    );
  });

  it('event.published (re-publication) → aucun abonné notifié', async () => {
    const payload: EventPublishedPayload = {
      eventId: 'e-1',
      title: 'Tournoi Magic',
      actorId: null,
      firstPublish: false,
      organizerId: 'org-1',
      activityId: 'act-1',
      categoryId: null,
      venueId: null,
    };
    await bus.publish(makeDomainEvent<EventPublishedPayload>(DOMAIN_EVENTS.EVENT_PUBLISHED, payload));

    expect(notifications.notifyFollowersOfNewEvent).not.toHaveBeenCalled();
  });
});
