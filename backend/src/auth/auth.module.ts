import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AccountModule } from '../account/account.module';
import { IdentityModule } from '../identity/identity.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthService } from './services/auth.service';

/**
 * Authentification & autorisation.
 *
 * Les guards globaux (APP_GUARD) s'enchaînent : JwtAuthGuard authentifie (sauf @Public()), puis
 * PermissionsGuard applique le RBAC fin (@RequirePermissions — ADR.08). AuthModule dépend
 * d'IdentityModule (calcul de l'identité effective + émission des jetons).
 */
@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule, IdentityModule, AccountModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
