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
