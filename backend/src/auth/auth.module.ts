import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';

/**
 * Authentification & autorisation.
 *
 * Les guards sont enregistrés globalement (APP_GUARD) : le JwtAuthGuard authentifie
 * (sauf routes @Public()), puis le RolesGuard applique le RBAC (@Roles(...)).
 */
@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
