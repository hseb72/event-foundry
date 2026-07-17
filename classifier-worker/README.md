# @event-foundry/classifier-worker

Moteur expert : consomme `CLASSIFICATION_QUEUE` (`OCRResult`), applique une chaîne de
`ClassificationRule` **déterministes**, produit un `ClassificationResult` publié sur
`RESULT_QUEUE`. **Aucune IA générative, aucune persistance, aucun accès PostgreSQL**
(TSPEC.05, ADR.06, ADR.07).

## Chaîne de règles (ordonnée, réordonnable — ADR.06)

`TitleRule → DateRule → TimeRule → ActivityRule → EventTypeRule → EventFormatRule →
OrganizerRule → VenueRule → PriceRule → UrlRule → CapacityRule`

Chaque règle est indépendante, ne connaît pas les autres, calcule son propre **score de
confiance par champ** (aucun score global) et peut émettre des **diagnostics** (ambiguïté,
info). Le moteur (`RulePipelineEngine`) orchestre seulement l'exécution ; une règle en
échec n'interrompt pas les autres.

## Référentiels (jamais codés en dur)

Les règles travaillent sur un `ReferenceSnapshot` (activités + alias, types, formats,
organisateurs, lieux) fourni par `ReferenceDataProvider`. L'implémentation V1
(`HttpReferenceDataProvider`) charge ces données via l'**API REST du Backend** avec cache
+ TTL, et **dégradation gracieuse** si le Backend est indisponible (les règles texte —
date, heure, prix, URL — continuent de fonctionner). Le `Domain` n'est jamais recherché :
il est déduit de l'`Activity` par le Backend.

## Limites connues (V1)

- Heuristiques d'extraction volontairement simples (dates FR, heures, prix €, URL) — à
  enrichir. `TitleRule` prend la première ligne significative.
- `CapacityRule` produit un diagnostic (la capacité n'est pas un champ d'Event en V1).

## Démarrage

```bash
npm run infra:up            # Redis
npm run start:dev --workspace @event-foundry/classifier-worker
```

Variables : `REDIS_HOST/PORT`, `CLASSIFIER_BACKEND_URL`, `CLASSIFIER_SERVICE_EMAIL/PASSWORD`,
`REFERENCE_TTL_MS`, `CLASSIFIER_CONCURRENCY`.
