# @event-foundry/contracts

Contrats d'échange **partagés** entre les composants EventFoundry (Backend, OCR Worker,
Classifier Worker).

Référence : `docs/99-ADR.03-SharedContracts-v1.0.md`, `docs/03-TSPEC.03-ImportPipeline-v1.1.md`.

## Règle

> Les composants dépendent **exclusivement** de ces contrats et **jamais** des objets
> internes d'un autre composant. Ces contrats constituent les frontières officielles du
> système (ADR.03, ADR.07).

## Contenu

- `enums/` — énumérations métier stables (statuts, provenance, participation).
- `pipeline/` — contrats du pipeline d'import : `ImportRequest`, `OCRResult`,
  `ClassificationResult`.

Tout est ré-exporté depuis `src/index.ts`.
