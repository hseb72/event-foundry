import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { OrganizationAddressWithGeo } from './organization-address.mapper';

const GEO_INCLUDE = {
  country: true,
  municipality: { include: { region: true } },
} as const;

/** Accès PostgreSQL aux adresses d'organisation (Prisma confiné au Repository — ADR.02). */
@Injectable()
export class OrganizationAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string): Promise<OrganizationAddressWithGeo[]> {
    return this.prisma.organizationAddress.findMany({
      where: { organizationId },
      include: GEO_INCLUDE,
      orderBy: [{ isPrimary: 'desc' }, { label: 'asc' }],
    });
  }

  findById(id: string): Promise<OrganizationAddressWithGeo | null> {
    return this.prisma.organizationAddress.findUnique({ where: { id }, include: GEO_INCLUDE });
  }

  /**
   * Crée une adresse. Si `isPrimary`, désactive l'ancienne principale dans la même transaction
   * (invariant : une seule adresse principale par organisation).
   */
  async create(input: {
    organizationId: string;
    label: string;
    countryId: string;
    municipalityId: string | null;
    postalCode: string;
    streetLines: string;
    isPrimary: boolean;
  }): Promise<OrganizationAddressWithGeo> {
    return this.prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.organizationAddress.updateMany({
          where: { organizationId: input.organizationId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.organizationAddress.create({ data: input, include: GEO_INCLUDE });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.organizationAddress.delete({ where: { id } });
  }

  /** Marque une adresse comme principale (et rétrograde l'ancienne) en une transaction. */
  async setPrimary(organizationId: string, id: string): Promise<OrganizationAddressWithGeo> {
    return this.prisma.$transaction(async (tx) => {
      await tx.organizationAddress.updateMany({
        where: { organizationId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.organizationAddress.update({
        where: { id },
        data: { isPrimary: true },
        include: GEO_INCLUDE,
      });
    });
  }
}
