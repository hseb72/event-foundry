import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { SecurityAuditService } from '../account/services/security-audit.service';
import type { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService (FSPEC.19)', () => {
  let repository: {
    ensureFunctionRole: jest.Mock;
    slugExists: jest.Mock;
    findDefaultPlanId: jest.Mock;
    createWithOwner: jest.Mock;
    listForUser: jest.Mock;
    listMembers: jest.Mock;
    memberFunctions: jest.Mock;
    setMemberFunction: jest.Mock;
    removeMember: jest.Mock;
    countByFunction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: OrganizationsService;

  beforeEach(() => {
    repository = {
      ensureFunctionRole: jest.fn().mockResolvedValue('role-id'),
      slugExists: jest.fn().mockResolvedValue(false),
      findDefaultPlanId: jest.fn().mockResolvedValue('plan-free'),
      createWithOwner: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Cave', slug: 'cave' }),
      listForUser: jest.fn(),
      listMembers: jest.fn().mockResolvedValue([]),
      memberFunctions: jest.fn(),
      setMemberFunction: jest.fn().mockResolvedValue(undefined),
      removeMember: jest.fn().mockResolvedValue(undefined),
      countByFunction: jest.fn(),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new OrganizationsService(
      repository as unknown as OrganizationsRepository,
      audit as unknown as SecurityAuditService,
    );
  });

  describe('create', () => {
    it('crée l’organisation avec l’appelant Owner (slug unique) et historise', async () => {
      const org = await service.create('u-1', 'La Cave aux Cartes');
      expect(repository.createWithOwner).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-1', ownerRoleId: 'role-id', slug: 'la-cave-aux-cartes' }),
      );
      expect(audit.record).toHaveBeenCalledWith('organization.created', 'u-1', expect.any(Object));
      expect(org.id).toBe('org-1');
    });

    it('suffixe le slug s’il est déjà pris', async () => {
      repository.slugExists.mockResolvedValueOnce(true).mockResolvedValue(false);
      await service.create('u-1', 'Cave');
      const slug = repository.createWithOwner.mock.calls[0][0].slug as string;
      expect(slug).toMatch(/^cave-[a-z0-9]{4}$/);
    });
  });

  describe('autorisation de gestion', () => {
    it('un Event Manager ne peut pas lister les membres (Forbidden)', async () => {
      repository.memberFunctions.mockResolvedValue(['Event Manager']);
      await expect(service.listMembers('u-1', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('un non-membre → NotFound', async () => {
      repository.memberFunctions.mockResolvedValue(null);
      await expect(service.listMembers('u-x', 'org-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('un Administrator peut lister les membres', async () => {
      repository.memberFunctions.mockResolvedValue(['Administrator']);
      await expect(service.listMembers('u-1', 'org-1')).resolves.toEqual([]);
    });
  });

  describe('invariant dernier Owner (ORG-004)', () => {
    it('interdit de retirer le dernier Owner', async () => {
      repository.memberFunctions.mockImplementation((uid: string) =>
        Promise.resolve(uid === 'actor' ? ['Owner'] : ['Owner']),
      );
      repository.countByFunction.mockResolvedValue(1);
      await expect(service.removeMember('actor', 'org-1', 'target')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.removeMember).not.toHaveBeenCalled();
    });

    it('interdit au dernier Owner de quitter l’organisation', async () => {
      repository.memberFunctions.mockResolvedValue(['Owner']);
      repository.countByFunction.mockResolvedValue(1);
      await expect(service.leave('u-1', 'org-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('autorise le départ d’un Owner s’il en reste un autre', async () => {
      repository.memberFunctions.mockResolvedValue(['Owner']);
      repository.countByFunction.mockResolvedValue(2);
      await service.leave('u-1', 'org-1');
      expect(repository.removeMember).toHaveBeenCalledWith('u-1', 'org-1');
    });
  });

  describe('transfert de propriété (§13)', () => {
    it('cible devient Owner, appelant devient Administrator, historisé', async () => {
      repository.memberFunctions.mockImplementation((uid: string) =>
        Promise.resolve(uid === 'owner' ? ['Owner'] : ['Event Manager']),
      );
      await service.transferOwnership('owner', 'org-1', 'target');
      expect(repository.setMemberFunction).toHaveBeenCalledWith('target', 'org-1', 'role-id');
      expect(repository.setMemberFunction).toHaveBeenCalledWith('owner', 'org-1', 'role-id');
      expect(audit.record).toHaveBeenCalledWith('organization.ownership_transferred', 'owner', {
        organizationId: 'org-1',
        to: 'target',
      });
    });

    it('un non-Owner ne peut pas transférer', async () => {
      repository.memberFunctions.mockResolvedValue(['Administrator']);
      await expect(service.transferOwnership('u-1', 'org-1', 'target')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
