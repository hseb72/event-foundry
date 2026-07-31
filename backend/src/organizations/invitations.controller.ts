import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcceptInvitationDto } from './dto/organization.dto';
import { InvitationsService } from './invitations.service';

/**
 * Acceptation d'une invitation (FSPEC.19 §7). Route non liée à une organisation dans l'URL :
 * l'organisation est déduite du jeton. Authentifiée — un nouvel utilisateur crée d'abord son compte
 * (avec l'adresse invitée) puis accepte.
 */
@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Invitation acceptée : l’utilisateur rejoint l’organisation.' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptInvitationDto,
  ): Promise<{ organizationId: string; organizationName: string }> {
    return this.invitations.accept(user.userId, user.email, dto.token);
  }
}
