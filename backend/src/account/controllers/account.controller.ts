import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import {
  ChangePasswordDto,
  ConfirmEmailChangeDto,
  ForgotPasswordDto,
  RequestEmailChangeDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/account.dto';
import { AccountLifecycleService } from '../services/account-lifecycle.service';
import { AccountSecurityService } from '../services/account-security.service';

/**
 * Cycle de vie et sécurité du compte (FSPEC.18). Les endpoints « à lien » sont publics par nature
 * (l'utilisateur suit un lien reçu par e-mail, potentiellement sans session) et leurs réponses
 * restent neutres (pas d'énumération) ; les opérations sensibles en session exigent la
 * réauthentification par mot de passe (IAM-008).
 */
@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(
    private readonly lifecycle: AccountLifecycleService,
    private readonly security: AccountSecurityService,
  ) {}

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "Adresse vérifiée ; le compte devient actif." })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    await this.lifecycle.verifyEmail(dto.token);
    return { verified: true };
  }

  @Public()
  @Post('verify-email/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOkResponse({ description: 'Nouveau lien envoyé si le compte existe et attend une vérification.' })
  async resend(@Body() dto: ResendVerificationDto): Promise<{ accepted: boolean }> {
    await this.lifecycle.resendVerification(dto.email);
    return { accepted: true };
  }

  @ApiBearerAuth()
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Mot de passe remplacé ; les liens de récupération sont invalidés.' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ changed: boolean }> {
    await this.security.changePassword(user.userId, dto.currentPassword, dto.newPassword);
    return { changed: true };
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOkResponse({ description: 'Lien de récupération envoyé si le compte existe (réponse neutre).' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ accepted: boolean }> {
    await this.security.requestPasswordReset(dto.email);
    return { accepted: true };
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Mot de passe remplacé à partir du lien de récupération.' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ reset: boolean }> {
    await this.security.resetPassword(dto.token, dto.newPassword);
    return { reset: true };
  }

  @ApiBearerAuth()
  @Post('email/change-request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOkResponse({ description: 'Lien de confirmation envoyé à la nouvelle adresse.' })
  async requestEmailChange(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailChangeDto,
  ): Promise<{ accepted: boolean }> {
    await this.security.requestEmailChange(user.userId, dto.currentPassword, dto.newEmail);
    return { accepted: true };
  }

  @Public()
  @Post('email/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "Nouvelle adresse appliquée (l'ancienne cesse d'être valide)." })
  async confirmEmailChange(@Body() dto: ConfirmEmailChangeDto): Promise<{ confirmed: boolean }> {
    await this.security.confirmEmailChange(dto.token);
    return { confirmed: true };
  }
}
