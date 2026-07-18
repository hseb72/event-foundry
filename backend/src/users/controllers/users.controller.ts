import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { SetUserRolesDto } from '../dto/set-user-roles.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { SystemRole } from '../constants/role.constants';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Profil de l'utilisateur authentifié. */
  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdWithRoles(current.userId);
    if (!user) {
      throw new UserNotFoundException(current.userId);
    }
    return UserMapper.toResponse(user);
  }

  /** Administration : liste des utilisateurs (réservé ADMIN). */
  @Get()
  @Roles(SystemRole.ADMIN)
  @ApiOkResponse({ type: [UserResponseDto] })
  async list(): Promise<UserResponseDto[]> {
    const users = await this.usersService.listAll();
    return users.map(UserMapper.toResponse);
  }

  /** Administration : active / désactive un compte (réservé ADMIN). */
  @Patch(':id/status')
  @Roles(SystemRole.ADMIN)
  @ApiOkResponse({ type: UserResponseDto })
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return UserMapper.toResponse(
      await this.usersService.setActive(id, dto.isActive, current.userId),
    );
  }

  /** Administration : remplace les rôles d'un utilisateur (réservé ADMIN). */
  @Put(':id/roles')
  @Roles(SystemRole.ADMIN)
  @ApiOkResponse({ type: UserResponseDto })
  async setRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserRolesDto,
    @CurrentUser() current: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return UserMapper.toResponse(
      await this.usersService.setRoles(id, dto.roles, current.userId),
    );
  }
}
