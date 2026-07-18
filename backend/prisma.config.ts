import { defineConfig } from 'prisma/config';

/**
 * Configuration Prisma 7 (remplace les propriétés retirées du schéma). L'URL de connexion
 * pour Migrate/introspection est lue dans l'environnement (injectée par dotenv-cli en dev,
 * par les variables d'environnement en CI/prod). Le client applicatif, lui, se connecte via
 * un driver adapter (voir PrismaService).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
