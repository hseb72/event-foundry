# @event-foundry/backend

API REST et orchestration EventFoundry (NestJS). **Orchestre** le pipeline sans jamais
exécuter l'OCR ni la classification (ARCHI.01, TSPEC.06).

## Structure cible par module (TSPEC.01)

```
src/
  main.ts
  app.module.ts
  <module>/
    <module>.module.ts
    controllers/   # REST, valide DTO -> Services (aucune logique métier)
    services/      # règles métier, orchestration, publie Jobs BullMQ (aucun SQL)
    repositories/  # encapsulent Prisma (seul accès PostgreSQL, étendent BaseRepository)
    entities/
    dto/           # Request + Response (les Entities ne sont jamais exposées)
    mappers/       # Entity <-> DTO
    validators/
    interfaces/
```

Modules V1 : `auth`, `users`, `reference-data`, `imports`, `event-candidates`,
`events`, `search`, `participation`, `calendar`.

## Démarrage

```bash
npm install                 # depuis la racine du monorepo
npm run infra:up            # PostgreSQL, Redis, MinIO
cp .env.example .env        # à la racine
npm run prisma:migrate --workspace @event-foundry/backend
npm run start:dev --workspace @event-foundry/backend
```

API préfixée `/api/v1`, documentation Swagger sur `/docs`.

## Authentification (EPIC 2)

RBAC par JWT. Guards globaux : `JwtAuthGuard` (authentifie, sauf routes `@Public()`) puis
`RolesGuard` (`@Roles(...)`).

| Méthode | Route | Accès | Rôle |
|---------|-------|-------|------|
| POST | `/api/v1/auth/register` | public | crée un compte (rôle USER) → jetons |
| POST | `/api/v1/auth/login` | public | e-mail + mot de passe → jetons |
| POST | `/api/v1/auth/refresh` | public | jeton de rafraîchissement → nouveaux jetons |
| GET | `/api/v1/users/me` | authentifié | profil courant |

Mots de passe hachés (bcrypt). Jetons d'accès et de rafraîchissement signés avec des
secrets distincts. Rôles système et admin de dev créés par `npm run prisma:seed`.

> Prisma Client doit être généré avant le build : `npm run prisma:generate`. La première
> migration s'obtient avec `npm run prisma:migrate` (nommer p. ex. `init_auth`).
