import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { UsersController } from './controllers/users.controller';
import { USERS_SERVICE } from './interfaces/users-service.interface';
import { RoleRepository } from './repositories/role.repository';
import { UserRepository } from './repositories/user.repository';
import { UsersService } from './services/users.service';

@Module({
  imports: [AccountModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_SERVICE, useExisting: UsersService },
    UserRepository,
    RoleRepository,
  ],
  exports: [UsersService, USERS_SERVICE],
})
export class UsersModule {}
