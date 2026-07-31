import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus, type OrganizationInvitation } from '@prisma/client';
import { SecurityAuditService } from '../account/services/security-audit.service';
import {
  accountTokenExpiry,
  generateAccountToken,
  hashAccountToken,
} from '../account/services/account-token.util';
import { MailService } from '../mail/mail.service';
import { OrganizationsRepository } from './organizations.repository';
import { canManageMembers, functionPermissions, ORG_FUNCTIONS, type OrgFunction } from './organizations.service';

/** Durée de validité d'une invitation (ORG-005). */
const INVITATION_TTL_HOURS = 7 * 24;

/**
 * Invitations à rejoindre une organisation (FSPEC.19 §6-8). Un Owner/Administrator invite par e-mail
 * (fonction + lien sécurisé à durée limitée). L'acceptation fait rejoindre l'organisation (compte
 * existant) ; un nouvel utilisateur s'inscrit d'abord puis accepte. Jeton à usage unique haché
 * (jamais en clair). Chaque étape est historisée (ORG-009).
 */
@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly repository: OrganizationsRepository,
    private readonly audit: SecurityAuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Invite un collaborateur (Owner/Administrator). Émet le lien sécurisé par e-mail. */
  async invite(
    actorId: string,
    organizationId: string,
    email: string,
    fn: OrgFunction,
  ): Promise<{ id: string }> {
    await this.assertCanManage(actorId, organizationId);
    if (!ORG_FUNCTIONS.includes(fn)) {
      throw new BadRequestException('Fonction inconnue.');
    }
    const raw = generateAccountToken();
    const invitation = await this.repository.createInvitation({
      organizationId,
      email: email.toLowerCase(),
      function: fn,
      tokenHash: hashAccountToken(raw),
      invitedById: actorId,
      expiresAt: accountTokenExpiry(INVITATION_TTL_HOURS),
    });
    await this.deliver(email, organizationId, raw);
    await this.audit.record('organization.invited', actorId, { organizationId, email: invitation.email, function: fn });
    return { id: invitation.id };
  }

  listPending(actorId: string, organizationId: string): Promise<OrganizationInvitation[]> {
    return this.assertCanManage(actorId, organizationId).then(() =>
      this.repository.listPendingInvitations(organizationId),
    );
  }

  /** Annule une invitation en attente (§8). */
  async cancel(actorId: string, organizationId: string, invitationId: string): Promise<void> {
    await this.assertCanManage(actorId, organizationId);
    const invitation = await this.findPendingOrThrow(invitationId, organizationId);
    await this.repository.setInvitationStatus(invitation.id, InvitationStatus.CANCELLED);
    await this.audit.record('organization.invitation_cancelled', actorId, { organizationId, invitationId });
  }

  /** Renvoie une invitation : nouveau jeton + nouvelle expiration, puis renvoi de l'e-mail (§9). */
  async resend(actorId: string, organizationId: string, invitationId: string): Promise<void> {
    await this.assertCanManage(actorId, organizationId);
    const invitation = await this.findPendingOrThrow(invitationId, organizationId);
    const raw = generateAccountToken();
    await this.repository.refreshInvitation(invitation.id, hashAccountToken(raw), accountTokenExpiry(INVITATION_TTL_HOURS));
    await this.deliver(invitation.email, organizationId, raw);
    await this.audit.record('organization.invitation_resent', actorId, { organizationId, invitationId });
  }

  /**
   * Acceptation par l'utilisateur connecté (§7). L'adresse de l'invitation doit correspondre à celle
   * du compte. Une invitation expirée est marquée EXPIRED et rejetée (ORG-006).
   */
  async accept(
    userId: string,
    userEmail: string,
    rawToken: string,
  ): Promise<{ organizationId: string; organizationName: string }> {
    const invitation = await this.repository.findInvitationByToken(hashAccountToken(rawToken));
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation invalide ou déjà utilisée.');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await this.repository.setInvitationStatus(invitation.id, InvitationStatus.EXPIRED);
      throw new GoneException('Cette invitation a expiré.');
    }
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Cette invitation vise une autre adresse e-mail.');
    }
    const roleId = await this.repository.ensureFunctionRole(
      invitation.function,
      `Fonction d'organisation : ${invitation.function}.`,
      functionPermissions(invitation.function as OrgFunction),
    );
    await this.repository.joinWithFunction(userId, invitation.organizationId, roleId);
    await this.repository.setInvitationStatus(invitation.id, InvitationStatus.ACCEPTED, new Date());
    await this.audit.record('organization.invitation_accepted', userId, {
      organizationId: invitation.organizationId,
      function: invitation.function,
    });
    this.logger.log(`InvitationAccepted org=${invitation.organizationId} user=${userId}`);
    return { organizationId: invitation.organization.id, organizationName: invitation.organization.name };
  }

  // --- Helpers ---

  private async assertCanManage(userId: string, organizationId: string): Promise<void> {
    const functions = await this.repository.memberFunctions(userId, organizationId);
    if (!functions) {
      throw new NotFoundException('Appartenance introuvable pour cette organisation.');
    }
    if (!canManageMembers(functions)) {
      throw new ForbiddenException('Réservé au Owner ou à un Administrator de l’organisation.');
    }
  }

  private async findPendingOrThrow(id: string, organizationId: string): Promise<OrganizationInvitation> {
    const invitation = await this.repository.findInvitation(id, organizationId);
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new NotFoundException('Invitation introuvable ou déjà traitée.');
    }
    return invitation;
  }

  private async deliver(email: string, organizationId: string, rawToken: string): Promise<void> {
    const base = this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:4200');
    const url = `${base}/accept-invitation?token=${rawToken}`;
    const orgName = (await this.repository.organizationName(organizationId)) ?? 'une organisation';
    await this.mail.send({
      to: email,
      subject: `Invitation à rejoindre ${orgName} sur EventFoundry`,
      html:
        `<p>Vous êtes invité·e à rejoindre <strong>${orgName}</strong> sur EventFoundry.</p>` +
        `<p><a href="${url}">Accepter l'invitation</a></p>` +
        `<p style="color:#888;font-size:12px">Ce lien expire dans 7 jours. Si le bouton ne fonctionne pas : ${url}</p>`,
    });
  }
}
