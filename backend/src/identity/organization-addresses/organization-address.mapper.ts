import type { Country, Municipality, OrganizationAddress, Region } from '@prisma/client';
import { OrganizationAddressDto } from './organization-address.dto';

/** Adresse enrichie de son pays et de sa commune (avec région) pour la vue dérivée. */
export type OrganizationAddressWithGeo = OrganizationAddress & {
  country: Country;
  municipality: (Municipality & { region: Region }) | null;
};

export class OrganizationAddressMapper {
  static toResponse(address: OrganizationAddressWithGeo): OrganizationAddressDto {
    return {
      id: address.id,
      organizationId: address.organizationId,
      label: address.label,
      countryId: address.countryId,
      countryName: address.country.name,
      postalCode: address.postalCode,
      municipalityId: address.municipalityId,
      municipalityName: address.municipality ? address.municipality.name : null,
      regionName: address.municipality ? address.municipality.region.name : null,
      streetLines: address.streetLines,
      isPrimary: address.isPrimary,
    };
  }
}
