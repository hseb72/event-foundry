import { Experience } from '@prisma/client';
import type { IdentityGraph } from '../entities/identity-graph.entity';
import type { IdentityRepository } from '../repositories/identity.repository';
import { IdentityService } from './identity.service';

describe('IdentityService — mode organisateur autonome (self-service)', () => {
  let repository: {
    ensurePlatformRole: jest.Mock;
    addPlatformRole: jest.Mock;
    removePlatformRole: jest.Mock;
    setActiveExperience: jest.Mock;
    loadGraphOrThrow: jest.Mock;
  };
  let service: IdentityService;

  const graph = (over: Partial<IdentityGraph> = {}): IdentityGraph =>
    ({
      id: 'u-1',
      email: 'u@b.c',
      displayName: 'U',
      roles: [],
      memberships: [],
      activeExperience: null,
      activeOrganizationId: null,
      ...over,
    }) as unknown as IdentityGraph;

  beforeEach(() => {
    repository = {
      ensurePlatformRole: jest.fn().mockResolvedValue('role-auto'),
      addPlatformRole: jest.fn().mockResolvedValue(undefined),
      removePlatformRole: jest.fn().mockResolvedValue(undefined),
      setActiveExperience: jest.fn().mockResolvedValue(undefined),
      loadGraphOrThrow: jest.fn().mockResolvedValue(graph()),
    };
    service = new IdentityService(repository as unknown as IdentityRepository);
  });

  it('activation : garantit le rôle plateforme puis l’assigne', async () => {
    await service.setAutonomousOrganizer('u-1', true);
    expect(repository.ensurePlatformRole).toHaveBeenCalledWith(
      'Organisateur autonome',
      expect.any(String),
      Experience.ORGANIZER,
      expect.arrayContaining(['event.create', 'event.publish']),
    );
    expect(repository.addPlatformRole).toHaveBeenCalledWith('u-1', 'role-auto');
    expect(repository.removePlatformRole).not.toHaveBeenCalled();
  });

  it('désactivation : retire le rôle et repli sur Explorer si l’expérience active était Organizer', async () => {
    // Après retrait, le graphe n'expose plus aucune expérience Organizer.
    repository.loadGraphOrThrow.mockResolvedValue(graph({ activeExperience: Experience.ORGANIZER }));
    await service.setAutonomousOrganizer('u-1', false);
    expect(repository.removePlatformRole).toHaveBeenCalledWith('u-1', 'role-auto');
    expect(repository.setActiveExperience).toHaveBeenCalledWith('u-1', Experience.EXPLORER);
  });

  it('désactivation : ne touche pas l’expérience active si elle n’était pas Organizer', async () => {
    repository.loadGraphOrThrow.mockResolvedValue(graph({ activeExperience: Experience.EXPLORER }));
    await service.setAutonomousOrganizer('u-1', false);
    expect(repository.setActiveExperience).not.toHaveBeenCalled();
  });
});
