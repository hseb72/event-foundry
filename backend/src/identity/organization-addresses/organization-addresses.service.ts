import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IdentityRepository } from '../repositories/identity.repository';
import { CreateOrganizationAddressDto } from './organization-address.dto';
import type { OrganizationAddressWithGeo } from './organization-address.mapper';
import { OrganizationAddressRepository } from './organization-address.repository';

/**
 * Gestion des adresses d'organisation (Localisation V3, chantier §8.2/§8.3), à la main de
 * l'organizer (permission `organization.manage`). Isolation multi-tenant : l'utilisateur doit être
 * membre de l'organisation ciblée (RG-ORG-05). La région est dérivée de la commune (jamais saisie).
 */
@Injectable()
export class OrganizationAddressesService {
  constructor(
    private readonly repository: OrganizationAddressRepository,
    private readonly identity: IdentityRepository,
  ) {}

  async list(userId: string, organizationId: string): Promise<OrganizationAddressWithGeo[]> {
    await this.assertMember(userId, organizationId);
    return this.repository.listByOrganization(organizationId);
  }

  async create(
    userId: string,
    organizationId: string,
    dto: CreateOrganizationAddressDto,
  ): Promise<OrganizationAddressWithGeo> {
    await this.assertMember(userId, organizationId);
    return this.repository.create({
      organizationId,
      label: dto.label,
      countryId: dto.countryId,
      municipalityId: dto.municipalityId ?? null,
      postalCode: dto.postalCode.trim(),
      streetLines: dto.streetLines,
      isPrimary: dto.isPrimary ?? false,
    });
  }

  async remove(userId: string, organizationId: string, addressId: string): Promise<void> {
    await this.assertMember(userId, organizationId);
    await this.assertBelongs(organizationId, addressId);
    await this.repository.delete(addressId);
  }

  async setPrimary(
    userId: string,
    organizationId: string,
    addressId: string,
  ): Promise<OrganizationAddressWithGeo> {
    await this.assertMember(userId, organizationId);
    await this.assertBelongs(organizationId, addressId);
    return this.repository.setPrimary(organizationId, addressId);
  }

  /** Isolation : l'utilisateur doit appartenir à l'organisation (sinon 403). */
  private async assertMember(userId: string, organizationId: string): Promise<void> {
    if (!(await this.identity.isMember(userId, organizationId))) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }
  }

  /** L'adresse doit appartenir à l'organisation du contexte (pas de fuite inter-tenant). */
  private async assertBelongs(organizationId: string, addressId: string): Promise<void> {
    const address = await this.repository.findById(addressId);
    if (!address || address.organizationId !== organizationId) {
      throw new NotFoundException('Adresse introuvable pour cette organisation.');
    }
  }
}
