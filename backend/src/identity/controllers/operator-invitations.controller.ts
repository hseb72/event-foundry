import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import type { OperatorInvitation } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { OperatorInvitationsService } from '../services/operator-invitations.service';

class InviteOperatorDto {
  @ApiProperty({ example: 'operateur@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Rôle plateforme (défaut : Platform Operator).' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  roleName?: string;
}

class AcceptOperatorInvitationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;
}

/**
 * Invitations d'Operator (FSPEC.17 §5). Les opérations d'administration exigent `user.manage` ;
 * l'acceptation n'exige que d'être authentifié (l'invité, après inscription si nécessaire).
 */
@ApiTags('operator-invitations')
@ApiBearerAuth()
@Controller('admin/operators/invitations')
export class OperatorInvitationsController {
  constructor(private readonly service: OperatorInvitationsService) {}

  @Post()
  @RequirePermissions('user.manage')
  @ApiOkResponse({ description: 'Operator invité par e-mail.' })
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteOperatorDto): Promise<{ id: string }> {
    return this.service.invite(user.userId, dto.email, dto.roleName);
  }

  @Get()
  @RequirePermissions('user.manage')
  @ApiOkResponse({ description: 'Invitations d’Operator en attente.' })
  pending(): Promise<OperatorInvitation[]> {
    return this.service.listPending();
  }

  @Delete(':id')
  @RequirePermissions('user.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Invitation annulée.' })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ cancelled: boolean }> {
    await this.service.cancel(user.userId, id);
    return { cancelled: true };
  }

  @Post(':id/resend')
  @RequirePermissions('user.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Invitation renvoyée (nouveau lien).' })
  async resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ resent: boolean }> {
    await this.service.resend(user.userId, id);
    return { resent: true };
  }
}

/** Acceptation d'une invitation d'Operator (route à part, sans exigence `user.manage`). */
@ApiTags('operator-invitations')
@ApiBearerAuth()
@Controller('operator-invitations')
export class OperatorInvitationAcceptController {
  constructor(private readonly service: OperatorInvitationsService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Invitation acceptée : le rôle Operator est attribué.' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptOperatorInvitationDto,
  ): Promise<{ roleName: string }> {
    return this.service.accept(user.userId, user.email, dto.token);
  }
}
