import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import {
  ChangePasswordDto,
  ConfirmEmailChangeDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  MfaDisableDto,
  MfaEnableDto,
  RequestEmailChangeDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/account.dto';
import { AccountLifecycleService } from '../services/account-lifecycle.service';
import { AccountMfaService } from '../services/account-mfa.service';
import { AccountPrivacyService } from '../services/account-privacy.service';
import { AccountSecurityService } from '../services/account-security.service';
import { OnboardingService, type OnboardingState } from '../services/onboarding.service';

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
    private readonly privacy: AccountPrivacyService,
    private readonly onboarding: OnboardingService,
    private readonly mfa: AccountMfaService,
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

  @ApiBearerAuth()
  @Get('me/export')
  @ApiOkResponse({ description: 'Export RGPD des données personnelles de l’utilisateur (IAM-010).' })
  exportData(@CurrentUser() user: AuthenticatedUser): Promise<Record<string, unknown>> {
    return this.privacy.exportData(user.userId);
  }

  @ApiBearerAuth()
  @Get('me/security-events')
  @ApiOkResponse({ description: 'Journal de sécurité de l’utilisateur (consultation — §15).' })
  securityEvents(@CurrentUser() user: AuthenticatedUser): Promise<unknown[]> {
    return this.privacy.securityHistory(user.userId);
  }

  @ApiBearerAuth()
  @Get('me/onboarding')
  @ApiOkResponse({ description: 'État d’onboarding de l’utilisateur (étapes + niveau).' })
  onboardingState(@CurrentUser() user: AuthenticatedUser): Promise<OnboardingState> {
    return this.onboarding.get(user.userId);
  }

  @ApiBearerAuth()
  @Post('me/onboarding/accept-terms')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Conditions d’utilisation acceptées.' })
  acceptTerms(@CurrentUser() user: AuthenticatedUser): Promise<OnboardingState> {
    return this.onboarding.acceptTerms(user.userId);
  }

  @ApiBearerAuth()
  @Get('me/mfa')
  @ApiOkResponse({ description: 'État du MFA (activé ou non).' })
  mfaStatus(@CurrentUser() user: AuthenticatedUser): Promise<{ enabled: boolean }> {
    return this.mfa.status(user.userId);
  }

  @ApiBearerAuth()
  @Post('me/mfa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Secret TOTP + URI d’approvisionnement (avant activation).' })
  mfaSetup(@CurrentUser() user: AuthenticatedUser): Promise<{ secret: string; otpauthUri: string }> {
    return this.mfa.setup(user.userId);
  }

  @ApiBearerAuth()
  @Post('me/mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'MFA activé ; renvoie les codes de récupération (une seule fois).' })
  mfaEnable(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaEnableDto,
  ): Promise<{ recoveryCodes: string[] }> {
    return this.mfa.enable(user.userId, dto.code);
  }

  @ApiBearerAuth()
  @Post('me/mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'MFA désactivé (réauthentification requise).' })
  async mfaDisable(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaDisableDto,
  ): Promise<{ disabled: boolean }> {
    await this.mfa.disable(user.userId, dto.currentPassword);
    return { disabled: true };
  }

  @ApiBearerAuth()
  @Post('me/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Compte supprimé (anonymisé, irréversible) après réauthentification.' })
  async deleteOwnAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ deleted: boolean }> {
    await this.privacy.deleteOwnAccount(user.userId, dto.currentPassword);
    return { deleted: true };
  }
}
