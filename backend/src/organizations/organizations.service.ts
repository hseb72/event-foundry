import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SecurityAuditService } from '../account/services/security-audit.service';
import { MyOrganization, OrganizationMember, OrganizationsRepository } from './organizations.repository';

/** Les trois fonctions d'organisation (FSPEC.19 §4). */
export const ORG_FUNCTIONS = ['Owner', 'Administrator', 'Event Manager'] as const;
export type OrgFunction = (typeof ORG_FUNCTIONS)[number];

const DEFAULT_PLAN = 'FREE';

/** Permissions de chaque fonction (miroir du seed ; sert au provisioning à la volée). */
const FUNCTION_PERMISSIONS: Record<OrgFunction, string[]> = {
  Owner: [
    'catalog.read', 'event.read', 'event.create', 'event.update', 'event.publish', 'event.archive',
    'import.create', 'import.execute', 'dashboard.view', 'statistics.view', 'organization.manage',
    'member.manage', 'organization.transfer',
  ],
  Administrator: [
    'catalog.read', 'event.read', 'event.create', 'event.update', 'event.publish', 'event.archive',
    'import.create', 'import.execute', 'dashboard.view', 'statistics.view', 'organization.manage',
    'member.manage',
  ],
  'Event Manager': [
    'catalog.read', 'event.read', 'event.create', 'event.update', 'event.publish', 'event.archive',
    'import.create', 'import.execute', 'dashboard.view', 'statistics.view',
  ],
};

/** Fonctions autorisées à gérer les collaborateurs (inviter, changer, retirer). */
const CAN_MANAGE_MEMBERS: OrgFunction[] = ['Owner', 'Administrator'];

/**
 * Domaine Organisations (FSPEC.19) : création self-service (le créateur devient Owner), gestion des
 * collaborateurs et de leurs fonctions, départ et transfert de propriété. Décisions déterministes :
 * autorisations par fonction, invariant « une organisation possède toujours un Owner » (ORG-002/004).
 * Toute opération est historisée (ORG-009). Les événements restent attachés à l'organisation (ORG-008).
 */
@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly repository: OrganizationsRepository,
    private readonly audit: SecurityAuditService,
  ) {}

  /** Fonction → identifiant de rôle, garanti existant (idempotent). */
  private ensureFunction(fn: OrgFunction): Promise<string> {
    return this.repository.ensureFunctionRole(fn, `Fonction d'organisation : ${fn}.`, FUNCTION_PERMISSIONS[fn]);
  }

  /** Création d'une organisation ; le créateur en devient l'unique Owner (AC-ORG-001). */
  async create(userId: string, name: string): Promise<{ id: string; name: string; slug: string }> {
    const slug = await this.uniqueSlug(name);
    const ownerRoleId = await this.ensureFunction('Owner');
    const subscriptionPlanId = await this.repository.findDefaultPlanId(DEFAULT_PLAN);
    const org = await this.repository.createWithOwner({ userId, name, slug, ownerRoleId, subscriptionPlanId });
    await this.audit.record('organization.created', userId, { organizationId: org.id, name });
    this.logger.log(`OrganizationCreated id=${org.id} owner=${userId}`);
    return org;
  }

  listMine(userId: string): Promise<MyOrganization[]> {
    return this.repository.listForUser(userId);
  }

  /** Liste des collaborateurs — réservé aux fonctions de gestion. */
  async listMembers(userId: string, organizationId: string): Promise<OrganizationMember[]> {
    await this.assertCanManage(userId, organizationId);
    return this.repository.listMembers(organizationId);
  }

  /**
   * Modifie la fonction d'un collaborateur (effet immédiat — §10). Interdit de rétrograder le dernier
   * Owner (ORG-004). Historisé.
   */
  async changeMemberFunction(
    actorId: string,
    organizationId: string,
    targetUserId: string,
    fn: OrgFunction,
  ): Promise<void> {
    await this.assertCanManage(actorId, organizationId);
    const targetFunctions = await this.membershipOrThrow(targetUserId, organizationId);
    if (targetFunctions.includes('Owner') && fn !== 'Owner' && (await this.ownerCount(organizationId)) <= 1) {
      throw new BadRequestException('Impossible de rétrograder le dernier Owner de l’organisation.');
    }
    const roleId = await this.ensureFunction(fn);
    await this.repository.setMemberFunction(targetUserId, organizationId, roleId);
    await this.audit.record('organization.member_role_changed', actorId, { organizationId, targetUserId, function: fn });
  }

  /** Retire un collaborateur (son compte reste actif — ORG-007). Interdit de retirer le dernier Owner. */
  async removeMember(actorId: string, organizationId: string, targetUserId: string): Promise<void> {
    await this.assertCanManage(actorId, organizationId);
    const targetFunctions = await this.membershipOrThrow(targetUserId, organizationId);
    if (targetFunctions.includes('Owner') && (await this.ownerCount(organizationId)) <= 1) {
      throw new BadRequestException('Impossible de retirer le dernier Owner de l’organisation.');
    }
    await this.repository.removeMember(targetUserId, organizationId);
    await this.audit.record('organization.member_removed', actorId, { organizationId, targetUserId });
  }

  /** Départ volontaire (§12). Le dernier Owner ne peut pas partir (ORG-004). */
  async leave(userId: string, organizationId: string): Promise<void> {
    const functions = await this.membershipOrThrow(userId, organizationId);
    if (functions.includes('Owner') && (await this.ownerCount(organizationId)) <= 1) {
      throw new BadRequestException(
        'Vous êtes le dernier Owner : transférez la propriété avant de quitter l’organisation.',
      );
    }
    await this.repository.removeMember(userId, organizationId);
    await this.audit.record('organization.member_left', userId, { organizationId });
  }

  /**
   * Transfert de propriété (§13) : la cible devient Owner, l'auteur passe Administrator. Une
   * organisation possède toujours un Owner (ORG-002). L'auteur doit être Owner ; la cible doit être
   * déjà membre. Historisé (AC-ORG-007).
   */
  async transferOwnership(actorId: string, organizationId: string, targetUserId: string): Promise<void> {
    const actorFunctions = await this.membershipOrThrow(actorId, organizationId);
    if (!actorFunctions.includes('Owner')) {
      throw new ForbiddenException('Seul un Owner peut transférer la propriété.');
    }
    if (targetUserId === actorId) {
      throw new BadRequestException('Vous êtes déjà Owner de cette organisation.');
    }
    await this.membershipOrThrow(targetUserId, organizationId);
    const [ownerRoleId, adminRoleId] = await Promise.all([
      this.ensureFunction('Owner'),
      this.ensureFunction('Administrator'),
    ]);
    await this.repository.setMemberFunction(targetUserId, organizationId, ownerRoleId);
    await this.repository.setMemberFunction(actorId, organizationId, adminRoleId);
    await this.audit.record('organization.ownership_transferred', actorId, { organizationId, to: targetUserId });
    this.logger.log(`OwnershipTransferred org=${organizationId} from=${actorId} to=${targetUserId}`);
  }

  // --- Helpers ---

  private async assertCanManage(userId: string, organizationId: string): Promise<void> {
    const functions = await this.membershipOrThrow(userId, organizationId);
    if (!functions.some((fn) => CAN_MANAGE_MEMBERS.includes(fn as OrgFunction))) {
      throw new ForbiddenException('Réservé au Owner ou à un Administrator de l’organisation.');
    }
  }

  private async membershipOrThrow(userId: string, organizationId: string): Promise<string[]> {
    const functions = await this.repository.memberFunctions(userId, organizationId);
    if (!functions) {
      throw new NotFoundException('Appartenance introuvable pour cette organisation.');
    }
    return functions;
  }

  private ownerCount(organizationId: string): Promise<number> {
    return this.repository.countByFunction(organizationId, 'Owner');
  }

  /** Slug lisible et unique dérivé du nom (suffixe court si déjà pris). */
  private async uniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'org';
    if (!(await this.repository.slugExists(base))) {
      return base;
    }
    for (let i = 0; i < 5; i++) {
      const candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      if (!(await this.repository.slugExists(candidate))) {
        return candidate;
      }
    }
    throw new ConflictException('Impossible de générer un identifiant unique pour cette organisation.');
  }
}
