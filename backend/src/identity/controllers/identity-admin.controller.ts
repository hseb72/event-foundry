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
import { AddMemberDto } from '../dto/add-member.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { OrganizationDto } from '../dto/organization.dto';
import { IdentityAdminService } from '../services/identity-admin.service';

/**
 * Administration de l'identité (rôles plateforme, organisations, membres). Toutes les routes
 * exigent la permission `user.manage` (RBAC fin — ADR.08), portée par le rôle Platform Operator.
 * Distincte des routes self-service `/identity/me`.
 */
@ApiTags('identity-admin')
@ApiBearerAuth()
@RequirePermissions('user.manage')
@Controller('identity')
export class IdentityAdminController {
  constructor(private readonly admin: IdentityAdminService) {}

  @Get('organizations')
  @ApiOkResponse({ type: [OrganizationDto] })
  listOrganizations(): Promise<OrganizationDto[]> {
    return this.admin.listOrganizations();
  }

  @Post('organizations')
  @ApiCreatedResponse({ description: "Identifiant de l'organisation créée." })
  createOrganization(@Body() dto: CreateOrganizationDto): Promise<{ id: string }> {
    return this.admin.createOrganization(dto.name, dto.slug);
  }

  @Post('organizations/:organizationId/members')
  @HttpCode(HttpStatus.NO_CONTENT)
  addMember(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: AddMemberDto,
  ): Promise<void> {
    return this.admin.addOrganizationMember(organizationId, dto.userId, dto.role);
  }

  @Post('users/:userId/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AssignRoleDto,
  ): Promise<void> {
    return this.admin.assignPlatformRole(userId, dto.role);
  }

  @Delete('users/:userId/roles/:role')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('role') role: string,
  ): Promise<void> {
    return this.admin.revokePlatformRole(userId, role);
  }
}
