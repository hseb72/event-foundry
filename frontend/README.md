# @event-foundry/frontend

Frontend **Angular 21** (standalone) d'EventFoundry — parcours consommateur V1.

Direction visuelle : `docs/11-UX.01-UIDesignDirection-v0.1.md` (accent consommateur = rose).

## Structure

```
src/app/
  core/
    api/            services HTTP typés (events, imports, participation, reference-data)
    auth/           AuthService, intercepteur Bearer, guard
    models.ts       interfaces miroir des DTO backend
  layout/           shell (sidebar + navigation)
  features/         login, catalogue (Découvrir), calendar (Mon planning), import
  shared/           event-card (+ actions de participation), utilitaires
```

## Écrans couverts (V1)

- **Login** (JWT, stockage local, redirection sur 401).
- **Découvrir** (catalogue) : recherche + filtres (activité, période, participation) ; état
  de participation visible ; actions Intéressé / Réservation / Paiement par carte.
- **Mon planning** : événements ayant une participation.
- **Importer** : upload fichier (PNG/JPG/PDF) ou texte → pipeline asynchrone.

## À venir dans l'EPIC 11 (prochaines itérations)

Écran de **validation** des EventCandidate (correction/validation/rejet), **fiche Event**
détaillée, **administration** des référentiels, **tableaux de bord** Admin/Organisateur,
flux de **refresh token**.

## Démarrage

```bash
# 1. Backend + infra
npm run infra:up
npm run start:dev --workspace @event-foundry/backend

# 2. Frontend (port 4200 ; le backend autorise CORS depuis :4200)
npm run start --workspace @event-foundry/frontend
```

API ciblée : `http://localhost:3000/api/v1` (voir `src/app/core/api.config.ts`).
