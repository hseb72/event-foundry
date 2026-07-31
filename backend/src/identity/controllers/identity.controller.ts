import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthTokensDto } from '../../auth/dto/auth-tokens.dto';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { ChangeExperienceDto } from '../dto/change-experience.dto';
import { IdentityMeDto } from '../dto/identity-me.dto';
import { OrganizerModeDto } from '../dto/organizer-mode.dto';
import { SwitchOrganizationDto } from '../dto/switch-organization.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import {
  IDENTITY_SERVICE,
  type IIdentityService,
} from '../interfaces/identity-service.interface';
import { toIdentityMeDto } from '../mappers/identity.mapper';
import { TokenService } from '../services/token.service';

/**
 * API du domaine Identity (TSPEC.06). Toutes les routes exigent une authentification (JwtAuthGuard
 * global). Le changement de contexte (expérience / organisation) réémet des jetons reflétant les
 * permissions du nouveau contexte — sans nouvelle authentification (ADR.11).
 */
@ApiTags('identity')
@ApiBearerAuth()
@Controller('identity/me')
export class IdentityController {
  constructor(
    @Inject(IDENTITY_SERVICE) private readonly identity: IIdentityService,
    private readonly tokens: TokenService,
  ) {}

  @Get()
  @ApiOkResponse({ type: IdentityMeDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<IdentityMeDto> {
    return this.buildMe(user.userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: IdentityMeDto })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<IdentityMeDto> {
    await this.identity.updateProfile(user.userId, {
      displayName: dto.displayName,
      preferences: dto.preferences,
    });
    return this.buildMe(user.userId);
  }

  @Patch('experience')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensDto })
  async changeExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeExperienceDto,
  ): Promise<AuthTokensDto> {
    const effective = await this.identity.changeActiveExperience(user.userId, dto.experience);
    return this.tokens.issueTokens(effective);
  }

  @Patch('organizer-mode')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensDto })
  async setOrganizerMode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OrganizerModeDto,
  ): Promise<AuthTokensDto> {
    // Réémet des jetons : le nouveau rôle change permissions et expériences disponibles.
    const effective = await this.identity.setAutonomousOrganizer(user.userId, dto.enabled);
    return this.tokens.issueTokens(effective);
  }

  @Patch('organization')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensDto })
  async switchOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchOrganizationDto,
  ): Promise<AuthTokensDto> {
    const effective = await this.identity.changeActiveOrganization(user.userId, dto.organizationId);
    return this.tokens.issueTokens(effective);
  }

  private async buildMe(userId: string): Promise<IdentityMeDto> {
    const [effective, graph] = await Promise.all([
      this.identity.getEffectiveIdentity(userId),
      this.identity.getIdentityGraph(userId),
    ]);
    return toIdentityMeDto(effective, graph);
  }
}
