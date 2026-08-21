import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus, RoleScope, type OperatorInvitation } from '@prisma/client';
import {
  accountTokenExpiry,
  generateAccountToken,
  hashAccountToken,
} from '../../account/services/account-token.util';
import { SecurityAuditService } from '../../account/services/security-audit.service';
import { MailService } from '../../mail/mail.service';
import { RoleScopeMismatchException } from '../exceptions/role-scope-mismatch.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { IdentityRepository } from '../repositories/identity.repository';

const INVITATION_TTL_HOURS = 7 * 24;
const DEFAULT_OPERATOR_ROLE = 'Platform Operator';

/**
 * Invitations à devenir Operator (FSPEC.17 §5). Portée PLATEFORME : un administrateur (`user.manage`)
 * invite par e-mail ; à l'acceptation, le rôle Operator est attribué au compte (existant ou créé via
 * l'inscription). Jeton à usage unique haché, expiration limitée — parallèle des invitations
 * d'organisation (FSPEC.19). Chaque étape est historisée.
 */
@Injectable()
export class OperatorInvitationsService {
  private readonly logger = new Logger(OperatorInvitationsService.name);

  constructor(
    private readonly repository: IdentityRepository,
    private readonly audit: SecurityAuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Invite un Operator par e-mail. Le rôle doit être un rôle PLATEFORME (défaut : Platform Operator). */
  async invite(actorId: string, email: string, roleName = DEFAULT_OPERATOR_ROLE): Promise<{ id: string }> {
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new RoleNotFoundException(roleName);
    }
    if (role.scope !== RoleScope.PLATFORM) {
      throw new RoleScopeMismatchException(roleName, RoleScope.PLATFORM);
    }
    const raw = generateAccountToken();
    const invitation = await this.repository.createOperatorInvitation({
      email: email.toLowerCase(),
      roleName,
      tokenHash: hashAccountToken(raw),
      invitedById: actorId,
      expiresAt: accountTokenExpiry(INVITATION_TTL_HOURS),
    });
    await this.deliver(email, roleName, raw);
    await this.audit.record('operator.invited', actorId, { email: invitation.email, roleName });
    return { id: invitation.id };
  }

  listPending(): Promise<OperatorInvitation[]> {
    return this.repository.listPendingOperatorInvitations();
  }

  async cancel(actorId: string, invitationId: string): Promise<void> {
    const invitation = await this.pendingOrThrow(invitationId);
    await this.repository.setOperatorInvitationStatus(invitation.id, InvitationStatus.CANCELLED);
    await this.audit.record('operator.invitation_cancelled', actorId, { invitationId });
  }

  async resend(actorId: string, invitationId: string): Promise<void> {
    const invitation = await this.pendingOrThrow(invitationId);
    const raw = generateAccountToken();
    await this.repository.refreshOperatorInvitation(invitation.id, hashAccountToken(raw), accountTokenExpiry(INVITATION_TTL_HOURS));
    await this.deliver(invitation.email, invitation.roleName, raw);
    await this.audit.record('operator.invitation_resent', actorId, { invitationId });
  }

  /** Acceptation par l'utilisateur connecté : l'adresse doit correspondre ; attribue le rôle Operator. */
  async accept(userId: string, userEmail: string, rawToken: string): Promise<{ roleName: string }> {
    const invitation = await this.repository.findOperatorInvitationByToken(hashAccountToken(rawToken));
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation invalide ou déjà utilisée.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.repository.setOperatorInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
      throw new GoneException('Cette invitation a expiré.');
    }
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Cette invitation vise une autre adresse e-mail.');
    }
    const role = await this.repository.findRoleByName(invitation.roleName);
    if (!role) {
      throw new RoleNotFoundException(invitation.roleName);
    }
    await this.repository.addPlatformRole(userId, role.id);
    await this.repository.setOperatorInvitationStatus(invitation.id, InvitationStatus.ACCEPTED, new Date());
    await this.audit.record('operator.invitation_accepted', userId, { roleName: invitation.roleName });
    this.logger.log(`OperatorInvitationAccepted user=${userId} role=${invitation.roleName}`);
    return { roleName: invitation.roleName };
  }

  // --- Helpers ---

  private async pendingOrThrow(id: string): Promise<OperatorInvitation> {
    const invitation = await this.repository.findOperatorInvitation(id);
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new NotFoundException('Invitation introuvable ou déjà traitée.');
    }
    return invitation;
  }

  private async deliver(email: string, roleName: string, rawToken: string): Promise<void> {
    const base = this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:4200');
    const url = `${base}/accept-invitation?token=${rawToken}&kind=operator`;
    await this.mail.send({
      to: email,
      subject: 'Invitation à rejoindre l’équipe Operator EventFoundry',
      html:
        `<p>Vous êtes invité·e à rejoindre l'équipe <strong>${roleName}</strong> d'EventFoundry.</p>` +
        `<p><a href="${url}">Accepter l'invitation</a></p>` +
        `<p style="color:#888;font-size:12px">Ce lien expire dans 7 jours. Si le bouton ne fonctionne pas : ${url}</p>`,
    });
  }
}
