import { BadRequestException, ForbiddenException, GoneException } from '@nestjs/common';
import { InvitationStatus, type OrganizationInvitation } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { SecurityAuditService } from '../account/services/security-audit.service';
import type { MailService } from '../mail/mail.service';
import { hashAccountToken } from '../account/services/account-token.util';
import { InvitationsService } from './invitations.service';
import type { OrganizationsRepository } from './organizations.repository';

describe('InvitationsService (FSPEC.19-B)', () => {
  let repository: {
    memberFunctions: jest.Mock;
    createInvitation: jest.Mock;
    findInvitationByToken: jest.Mock;
    setInvitationStatus: jest.Mock;
    ensureFunctionRole: jest.Mock;
    joinWithFunction: jest.Mock;
    organizationName: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let mail: { send: jest.Mock };
  let config: { get: jest.Mock };
  let service: InvitationsService;

  beforeEach(() => {
    repository = {
      memberFunctions: jest.fn().mockResolvedValue(['Owner']),
      createInvitation: jest.fn().mockResolvedValue({ id: 'inv-1', email: 'c@b.c' }),
      findInvitationByToken: jest.fn(),
      setInvitationStatus: jest.fn().mockResolvedValue(undefined),
      ensureFunctionRole: jest.fn().mockResolvedValue('role-em'),
      joinWithFunction: jest.fn().mockResolvedValue(undefined),
      organizationName: jest.fn().mockResolvedValue('Cave'),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    mail = { send: jest.fn().mockResolvedValue(true) };
    config = { get: jest.fn().mockReturnValue('http://localhost:4200') };
    service = new InvitationsService(
      repository as unknown as OrganizationsRepository,
      audit as unknown as SecurityAuditService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
    );
  });

  const invitation = (over: Partial<OrganizationInvitation> = {}): OrganizationInvitation & { organization: { id: string; name: string } } =>
    ({
      id: 'inv-1',
      organizationId: 'org-1',
      email: 'c@b.c',
      function: 'Event Manager',
      status: InvitationStatus.PENDING,
      tokenHash: hashAccountToken('raw'),
      expiresAt: new Date(Date.now() + 3600_000),
      organization: { id: 'org-1', name: 'Cave' },
      ...over,
    }) as unknown as OrganizationInvitation & { organization: { id: string; name: string } };

  describe('invite', () => {
    it('un Owner invite → crée l’invitation, envoie l’e-mail, historise', async () => {
      await service.invite('owner', 'org-1', 'C@B.C', 'Event Manager');
      expect(repository.createInvitation.mock.calls[0][0].email).toBe('c@b.c'); // normalisé
      expect(mail.send).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith('organization.invited', 'owner', expect.any(Object));
    });

    it('un Event Manager ne peut pas inviter', async () => {
      repository.memberFunctions.mockResolvedValue(['Event Manager']);
      await expect(service.invite('u', 'org-1', 'c@b.c', 'Owner')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('accept', () => {
    it('jeton valide + bonne adresse → rejoint l’organisation et marque ACCEPTED', async () => {
      repository.findInvitationByToken.mockResolvedValue(invitation());
      const result = await service.accept('u-1', 'c@b.c', 'raw');
      expect(repository.joinWithFunction).toHaveBeenCalledWith('u-1', 'org-1', 'role-em');
      expect(repository.setInvitationStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.ACCEPTED, expect.any(Date));
      expect(result).toEqual({ organizationId: 'org-1', organizationName: 'Cave' });
    });

    it('adresse différente → refus (Forbidden), pas d’adhésion', async () => {
      repository.findInvitationByToken.mockResolvedValue(invitation());
      await expect(service.accept('u-1', 'autre@b.c', 'raw')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.joinWithFunction).not.toHaveBeenCalled();
    });

    it('invitation expirée → marquée EXPIRED et rejetée (ORG-006)', async () => {
      repository.findInvitationByToken.mockResolvedValue(
        invitation({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.accept('u-1', 'c@b.c', 'raw')).rejects.toBeInstanceOf(GoneException);
      expect(repository.setInvitationStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.EXPIRED);
    });

    it('jeton inconnu → invalide', async () => {
      repository.findInvitationByToken.mockResolvedValue(null);
      await expect(service.accept('u-1', 'c@b.c', 'x')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
