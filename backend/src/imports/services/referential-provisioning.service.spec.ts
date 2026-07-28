import type { ExtractedEventFields } from '@event-foundry/contracts';
import { ReferentialProvisioningRepository } from '../repositories/referential-provisioning.repository';
import { ReferentialProvisioningService } from './referential-provisioning.service';

describe('ReferentialProvisioningService (auto-provisioning — ADR.24)', () => {
  let repo: jest.Mocked<
    Pick<
      ReferentialProvisioningRepository,
      | 'resolveOrCreateActivity'
      | 'resolveOrCreateEventType'
      | 'resolveOrCreateEventFormat'
      | 'resolveOrCreateOrganizer'
      | 'resolveOrCreateVenue'
    >
  >;
  let service: ReferentialProvisioningService;

  const fields: ExtractedEventFields = {
    activity: 'Riftbound',
    eventType: 'Tournoi',
    eventFormat: 'Constructed',
    organizer: 'Asso',
    venue: 'Le Repaire',
  };

  beforeEach(() => {
    repo = {
      resolveOrCreateActivity: jest.fn().mockResolvedValue('act-1'),
      resolveOrCreateEventType: jest.fn().mockResolvedValue(undefined),
      resolveOrCreateEventFormat: jest.fn().mockResolvedValue(undefined),
      resolveOrCreateOrganizer: jest.fn().mockResolvedValue(undefined),
      resolveOrCreateVenue: jest.fn().mockResolvedValue(undefined),
    };
    service = new ReferentialProvisioningService(
      repo as unknown as ReferentialProvisioningRepository,
    );
  });

  it('ne fait rien quand l’opt-in est désactivé', async () => {
    await service.provision(fields, { autoProvisionReferentials: false, provisioningDefaultDomainId: 'dom-1' });
    expect(repo.resolveOrCreateActivity).not.toHaveBeenCalled();
  });

  it('provisionne activité, type transverse, format transverse et référentiels indépendants', async () => {
    await service.provision(fields, { autoProvisionReferentials: true, provisioningDefaultDomainId: 'dom-1' });
    expect(repo.resolveOrCreateActivity).toHaveBeenCalledWith('Riftbound', 'dom-1');
    // Type transverse (DATA.01 v2.0) : provisionné par nom, sans rattachement à l'activité.
    expect(repo.resolveOrCreateEventType).toHaveBeenCalledWith('Tournoi');
    // Format transverse (DATA.01 §4) : provisionné sans rattachement à l'activité.
    expect(repo.resolveOrCreateEventFormat).toHaveBeenCalledWith('Constructed');
    expect(repo.resolveOrCreateOrganizer).toHaveBeenCalledWith('Asso');
    expect(repo.resolveOrCreateVenue).toHaveBeenCalledWith('Le Repaire');
  });

  it('provisionne le type transverse même sans activité, comme le format', async () => {
    repo.resolveOrCreateActivity.mockResolvedValue(null);
    await service.provision(fields, { autoProvisionReferentials: true, provisioningDefaultDomainId: null });
    // Type transverse : provisionné indépendamment de l'activité (DATA.01 v2.0).
    expect(repo.resolveOrCreateEventType).toHaveBeenCalledWith('Tournoi');
    expect(repo.resolveOrCreateEventFormat).toHaveBeenCalledWith('Constructed');
    // Les référentiels indépendants sont tout de même provisionnés.
    expect(repo.resolveOrCreateOrganizer).toHaveBeenCalledWith('Asso');
  });

  it('best-effort : une erreur de provisioning n’interrompt pas l’import', async () => {
    repo.resolveOrCreateActivity.mockRejectedValue(new Error('db down'));
    await expect(
      service.provision(fields, { autoProvisionReferentials: true, provisioningDefaultDomainId: 'dom-1' }),
    ).resolves.toBeUndefined();
  });
});
