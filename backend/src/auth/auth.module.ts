import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { IdentityModule } from '../identity/identity.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';

/**
 * Authentification & autorisation.
 *
 * Les guards globaux (APP_GUARD) s'enchaînent : JwtAuthGuard authentifie (sauf @Public()), puis
 * RolesGuard (RBAC par rôle — @Roles, compat V1) et PermissionsGuard (RBAC fin — @RequirePermissions,
 * mécanisme V2). AuthModule dépend d'IdentityModule (calcul de l'identité effective + jetons).
 */
@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule, IdentityModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
