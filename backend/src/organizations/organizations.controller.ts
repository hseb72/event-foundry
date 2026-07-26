import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  ChangeMemberFunctionDto,
  CreateOrganizationDto,
  TransferOwnershipDto,
} from './dto/organization.dto';
import type { MyOrganization, OrganizationMember } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

/**
 * API des organisations (FSPEC.19). Toutes les routes sont authentifiées ; l'autorisation fine
 * (Owner / Administrator, invariant dernier Owner) est portée par le Service, en fonction de
 * l'appartenance de l'appelant à l'organisation ciblée — indépendamment du contexte actif.
 */
@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @ApiOkResponse({ description: 'Organisation créée ; l’appelant en devient Owner.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrganizationDto,
  ): Promise<{ id: string; name: string; slug: string }> {
    return this.service.create(user.userId, dto.name);
  }

  @Get('mine')
  @ApiOkResponse({ description: 'Organisations de l’utilisateur et ses fonctions dans chacune.' })
  mine(@CurrentUser() user: AuthenticatedUser): Promise<MyOrganization[]> {
    return this.service.listMine(user.userId);
  }

  @Get(':id/members')
  @ApiOkResponse({ description: 'Collaborateurs de l’organisation (Owner / Administrator).' })
  members(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationMember[]> {
    return this.service.listMembers(user.userId, id);
  }

  @Patch(':id/members/:userId/function')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Fonction du collaborateur modifiée (effet immédiat).' })
  async changeFunction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() dto: ChangeMemberFunctionDto,
  ): Promise<{ updated: boolean }> {
    await this.service.changeMemberFunction(user.userId, id, targetUserId, dto.function);
    return { updated: true };
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Collaborateur retiré (son compte reste actif).' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ): Promise<{ removed: boolean }> {
    await this.service.removeMember(user.userId, id, targetUserId);
    return { removed: true };
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Départ volontaire de l’organisation.' })
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ left: boolean }> {
    await this.service.leave(user.userId, id);
    return { left: true };
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Propriété transférée à un autre membre (l’appelant devient Administrator).' })
  async transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferOwnershipDto,
  ): Promise<{ transferred: boolean }> {
    await this.service.transferOwnership(user.userId, id, dto.userId);
    return { transferred: true };
  }
}
