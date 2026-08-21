import { ForbiddenException, GoneException } from '@nestjs/common';
import { InvitationStatus, RoleScope, type OperatorInvitation } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';
import type { SecurityAuditService } from '../../account/services/security-audit.service';
import { hashAccountToken } from '../../account/services/account-token.util';
import type { MailService } from '../../mail/mail.service';
import { RoleScopeMismatchException } from '../exceptions/role-scope-mismatch.exception';
import { OperatorInvitationsService } from './operator-invitations.service';
import type { IdentityRepository } from '../repositories/identity.repository';

describe('OperatorInvitationsService (FSPEC.17 §5)', () => {
  let repository: {
    findRoleByName: jest.Mock;
    createOperatorInvitation: jest.Mock;
    findOperatorInvitationByToken: jest.Mock;
    setOperatorInvitationStatus: jest.Mock;
    addPlatformRole: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let mail: { send: jest.Mock };
  let config: { get: jest.Mock };
  let service: OperatorInvitationsService;

  beforeEach(() => {
    repository = {
      findRoleByName: jest.fn().mockResolvedValue({ id: 'role-op', scope: RoleScope.PLATFORM }),
      createOperatorInvitation: jest.fn().mockResolvedValue({ id: 'inv-1', email: 'op@b.c' }),
      findOperatorInvitationByToken: jest.fn(),
      setOperatorInvitationStatus: jest.fn().mockResolvedValue(undefined),
      addPlatformRole: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    mail = { send: jest.fn().mockResolvedValue(true) };
    config = { get: jest.fn().mockReturnValue('http://localhost:4200') };
    service = new OperatorInvitationsService(
      repository as unknown as IdentityRepository,
      audit as unknown as SecurityAuditService,
      mail as unknown as MailService,
      config as unknown as ConfigService,
    );
  });

  const invitation = (over: Partial<OperatorInvitation> = {}): OperatorInvitation =>
    ({
      id: 'inv-1',
      email: 'op@b.c',
      roleName: 'Platform Operator',
      status: InvitationStatus.PENDING,
      tokenHash: hashAccountToken('raw'),
      expiresAt: new Date(Date.now() + 3600_000),
      ...over,
    }) as OperatorInvitation;

  describe('invite', () => {
    it('rôle plateforme → crée l’invitation, envoie l’e-mail, historise', async () => {
      await service.invite('admin', 'OP@B.C', 'Platform Operator');
      expect(repository.createOperatorInvitation.mock.calls[0][0].email).toBe('op@b.c');
      expect(mail.send).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith('operator.invited', 'admin', expect.any(Object));
    });

    it('rôle non-plateforme → rejet', async () => {
      repository.findRoleByName.mockResolvedValue({ id: 'r', scope: RoleScope.ORGANIZATION });
      await expect(service.invite('admin', 'op@b.c', 'Owner')).rejects.toBeInstanceOf(
        RoleScopeMismatchException,
      );
    });
  });

  describe('accept', () => {
    it('jeton valide + bonne adresse → attribue le rôle et marque ACCEPTED', async () => {
      repository.findOperatorInvitationByToken.mockResolvedValue(invitation());
      const res = await service.accept('u-1', 'op@b.c', 'raw');
      expect(repository.addPlatformRole).toHaveBeenCalledWith('u-1', 'role-op');
      expect(repository.setOperatorInvitationStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.ACCEPTED, expect.any(Date));
      expect(res.roleName).toBe('Platform Operator');
    });

    it('adresse différente → refus, pas d’attribution', async () => {
      repository.findOperatorInvitationByToken.mockResolvedValue(invitation());
      await expect(service.accept('u-1', 'autre@b.c', 'raw')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.addPlatformRole).not.toHaveBeenCalled();
    });

    it('expirée → marquée EXPIRED et rejetée', async () => {
      repository.findOperatorInvitationByToken.mockResolvedValue(invitation({ expiresAt: new Date(Date.now() - 1000) }));
      await expect(service.accept('u-1', 'op@b.c', 'raw')).rejects.toBeInstanceOf(GoneException);
      expect(repository.setOperatorInvitationStatus).toHaveBeenCalledWith('inv-1', InvitationStatus.EXPIRED);
    });
  });
});
