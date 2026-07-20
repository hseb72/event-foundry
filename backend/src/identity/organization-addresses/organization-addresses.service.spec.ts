import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IdentityRepository } from '../repositories/identity.repository';
import { OrganizationAddressesService } from './organization-addresses.service';
import type { OrganizationAddressWithGeo } from './organization-address.mapper';
import { OrganizationAddressRepository } from './organization-address.repository';

describe('OrganizationAddressesService — adresses d’organisation (chantier §8.2)', () => {
  let repository: jest.Mocked<
    Pick<OrganizationAddressRepository, 'listByOrganization' | 'create' | 'findById' | 'delete' | 'setPrimary'>
  >;
  let identity: jest.Mocked<Pick<IdentityRepository, 'isMember'>>;
  let service: OrganizationAddressesService;

  beforeEach(() => {
    repository = {
      listByOrganization: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      setPrimary: jest.fn(),
    };
    identity = { isMember: jest.fn() };
    service = new OrganizationAddressesService(
      repository as unknown as OrganizationAddressRepository,
      identity as unknown as IdentityRepository,
    );
  });

  it('refuse l’accès à un non-membre (isolation multi-tenant)', async () => {
    identity.isMember.mockResolvedValue(false);
    await expect(service.list('user-1', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.listByOrganization).not.toHaveBeenCalled();
  });

  it('liste les adresses pour un membre', async () => {
    identity.isMember.mockResolvedValue(true);
    repository.listByOrganization.mockResolvedValue([]);
    await service.list('user-1', 'org-1');
    expect(repository.listByOrganization).toHaveBeenCalledWith('org-1');
  });

  it('crée une adresse (code postal normalisé, principale par défaut false)', async () => {
    identity.isMember.mockResolvedValue(true);
    repository.create.mockResolvedValue({ id: 'a-1' } as OrganizationAddressWithGeo);
    await service.create('user-1', 'org-1', {
      label: 'Boutique',
      countryId: 'c-1',
      postalCode: ' 75000 ',
      streetLines: '12 rue X',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', postalCode: '75000', isPrimary: false, municipalityId: null }),
    );
  });

  it('refuse de supprimer une adresse d’une autre organisation (pas de fuite inter-tenant)', async () => {
    identity.isMember.mockResolvedValue(true);
    repository.findById.mockResolvedValue({ id: 'a-1', organizationId: 'other-org' } as OrganizationAddressWithGeo);
    await expect(service.remove('user-1', 'org-1', 'a-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
