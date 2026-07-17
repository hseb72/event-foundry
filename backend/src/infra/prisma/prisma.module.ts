import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module global exposant `PrismaService`. Rendu global pour que chaque Repository puisse
 * l'injecter sans réimporter le module, tout en gardant Prisma confiné à la couche
 * Repository.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
