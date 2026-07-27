import { BadRequestException, ConflictException } from '@nestjs/common';
import type { NotificationsService } from '../../notifications/services/notifications.service';
import type { OrganizationsService } from '../../organizations/organizations.service';
import type { EventsService } from './events.service';
import { OrganizerNotifyService } from './organizer-notify.service';

describe('OrganizerNotifyService (FSPEC.22 §16)', () => {
  let events: { getForReader: jest.Mock };
  let organizations: { linkedOrganization: jest.Mock; memberIds: jest.Mock };
  let notifications: { notifyOrganizationOfPrivateEvent: jest.Mock };
  let service: OrganizerNotifyService;

  const privateEvent = (over: Record<string, unknown> = {}) => ({
    id: 'e1',
    title: 'Tournoi',
    visibility: 'PRIVATE',
    organizerId: 'org-ref-1',
    createdById: 'owner',
    ...over,
  });

  beforeEach(() => {
    events = { getForReader: jest.fn().mockResolvedValue(privateEvent()) };
    organizations = {
      linkedOrganization: jest.fn().mockResolvedValue({ id: 'ORG', name: 'La Cave' }),
      memberIds: jest.fn().mockResolvedValue(['m1', 'm2', 'owner']),
    };
    notifications = { notifyOrganizationOfPrivateEvent: jest.fn().mockResolvedValue(2) };
    service = new OrganizerNotifyService(
      events as unknown as EventsService,
      organizations as unknown as OrganizationsService,
      notifications as unknown as NotificationsService,
    );
  });

  it('notifie les membres de l’organisation liée (créateur exclu) sans transférer la propriété', async () => {
    const result = await service.notify('e1', 'owner');
    expect(notifications.notifyOrganizationOfPrivateEvent).toHaveBeenCalledWith(['m1', 'm2'], 'Tournoi');
    expect(result).toEqual({ notified: 2, organizationName: 'La Cave' });
  });

  it('refuse si l’événement n’est pas privé', async () => {
    events.getForReader.mockResolvedValue(privateEvent({ visibility: 'PUBLIC' }));
    await expect(service.notify('e1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse si aucun organisateur mentionné', async () => {
    events.getForReader.mockResolvedValue(privateEvent({ organizerId: null }));
    await expect(service.notify('e1', 'owner')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse si l’organisateur mentionné n’est pas enregistré (aucune organisation liée)', async () => {
    organizations.linkedOrganization.mockResolvedValue(null);
    await expect(service.notify('e1', 'owner')).rejects.toBeInstanceOf(ConflictException);
  });

  it('notifiableOrganization : null si aucun organisateur, sinon délègue', async () => {
    await expect(service.notifiableOrganization(null)).resolves.toBeNull();
    await service.notifiableOrganization('org-ref-1');
    expect(organizations.linkedOrganization).toHaveBeenCalledWith('org-ref-1');
  });
});
