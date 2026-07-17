# @event-foundry/classifier-worker

Moteur expert : `OCRResult` → `ClassificationResult`. **Règles déterministes uniquement**
(référentiels, alias, regex, heuristiques). **Aucune IA générative** (TSPEC.05, ADR.06).

Chaîne de règles indépendantes implémentant `ClassificationRule` :
`DateRule`, `TimeRule`, `ActivityRule`, `EventTypeRule`, `EventFormatRule`, `OrganizerRule`,
`VenueRule`, `PriceRule`, `UrlRule`, `CapacityRule`, puis `Confidence Engine`.

Le moteur ne dépend jamais d'une règle concrète. Le `Domain` est toujours déduit de
l'`Activity`. Aucune connaissance métier codée en dur : tout provient des référentiels.
Ne dépend jamais de Prisma, PostgreSQL, Angular ni Tesseract.
