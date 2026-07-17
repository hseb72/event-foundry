import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
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
}
