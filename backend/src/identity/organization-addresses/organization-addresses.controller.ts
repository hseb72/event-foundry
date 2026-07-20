import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { CreateOrganizationAddressDto, OrganizationAddressDto } from './organization-address.dto';
import { OrganizationAddressMapper } from './organization-address.mapper';
import { OrganizationAddressesService } from './organization-addresses.service';

/**
 * Adresses d'organisation à la main de l'organizer (chantier §8.2/§8.3) : permission
 * `organization.manage` + isolation membre (le service vérifie l'appartenance). Distinct des routes
 * d'administration plateforme (`user.manage`).
 */
@ApiTags('organization-addresses')
@ApiBearerAuth()
@RequirePermissions('organization.manage')
@Controller('identity/organizations/:organizationId/addresses')
export class OrganizationAddressesController {
  constructor(private readonly service: OrganizationAddressesService) {}

  @Get()
  @ApiOkResponse({ type: [OrganizationAddressDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<OrganizationAddressDto[]> {
    const addresses = await this.service.list(user.userId, organizationId);
    return addresses.map(OrganizationAddressMapper.toResponse);
  }

  @Post()
  @ApiCreatedResponse({ type: OrganizationAddressDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateOrganizationAddressDto,
  ): Promise<OrganizationAddressDto> {
    return OrganizationAddressMapper.toResponse(
      await this.service.create(user.userId, organizationId, dto),
    );
  }

  @Post(':addressId/primary')
  @ApiOkResponse({ type: OrganizationAddressDto })
  async setPrimary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<OrganizationAddressDto> {
    return OrganizationAddressMapper.toResponse(
      await this.service.setPrimary(user.userId, organizationId, addressId),
    );
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<void> {
    await this.service.remove(user.userId, organizationId, addressId);
  }
}
