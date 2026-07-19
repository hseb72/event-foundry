# OCR Worker

**Document** : TSPEC.04
**Fichier** : 03-TSPEC.04-OCRWorker-v1.0.md
**Version** : 1.0
**Statut** : Validé

---

# Objectif

Définir l'architecture technique du Worker OCR.

Le Worker transforme un document en texte brut.

Il ne possède aucune connaissance métier.

Il ne réalise aucune classification.

---

# Responsabilité

Entrée :

ImportRequest

Sortie :

OCRResult

---

# Principes

Le Worker est :

- stateless ;
- idempotent ;
- indépendant ;
- orienté contrats ;
- répliquable horizontalement.

---

# Architecture

```text
                 ImportRequest

                       │

                       ▼

              Document Loader

                       │

                       ▼

            Image Preprocessor

                       │

                       ▼

                 OCR Engine

                       │

                       ▼

            OCR Post Processor

                       │

                       ▼

                  OCRResult
```

Chaque composant possède une responsabilité unique.

---

# Technologies

|Responsabilité|Technologie|
|--------------|-----------|
|Runtime|Node.js|
|Framework|NestJS Standalone|
|OCR|Tesseract|
|Traitement image|OpenCV|
|Queue|BullMQ|
|Stockage|MinIO|

---

# Document Loader

Responsabilités :

- charger le document depuis MinIO ;
- vérifier son existence ;
- créer un contexte de traitement.

Il ne réalise aucun traitement d'image.

---

# Image Preprocessor

Responsabilités :

- rotation (auto-orientation) ;
- deskew ;
- grayscale ;
- contraste ;
- binarisation ;
- réduction du bruit ;
- upscaling (texte trop petit).

Chaque filtre est indépendant. L'ordre des filtres est configurable.

Le préprocesseur renvoie **une ou plusieurs variantes** (ex. « grayscale-normalized » et
« binarized ») : l'OCR est tenté sur chacune et la meilleure confiance est retenue
(multi-passes déterministe). Les variantes restent traçables.

> **Implémentation (2026-07)** : réalisée avec **`sharp`** à titre d'essai (dérogation
> temporaire à ADR.04 « Traitement d'image | OpenCV » — cf. note d'ADR.04). Le deskew avancé
> et l'analyse de composantes relèveraient d'OpenCV et restent à trancher.

---

# OCR Engine

Responsabilités :

- exécuter Tesseract ;
- produire le texte brut ;
- produire les informations techniques.

Aucune correction n'est réalisée ici.

Réglages Tesseract (surchargables par variables d'environnement) : moteur **LSTM** (OEM 1),
modèles **« standard »** (entiers) — sûrs avec le core WASM. Les modèles « best » (flottants)
sont **incompatibles** avec le core WASM de tesseract.js 7 (ils importent `DotProductSSE`,
absent des cores → crash `Aborted`) : `OCR_TESSDATA=best` est donc **ignoré** et rebascule sur
« standard ». **PSM** adapté aux affiches (texte épars par défaut),
préservation des espaces inter-mots. Un banc d'évaluation (`ocr-worker/eval`) mesure la
qualité (confiance, rappel de mots-clés) pour régler ces paramètres.

## Correction lexicale issue des référentiels

Pour fiabiliser la reconnaissance des **noms métier** (activités, types, formats,
organisateurs, lieux, villes, alias), le texte océrisé est **corrigé après l'OCR** par
rapprochement des **référentiels** : chaque mot suffisamment long, proche d'un unique terme du
lexique (distance d'édition bornée) et non déjà présent, est remplacé par ce terme (casse
conservée). Le lexique est chargé via l'**API Backend** (le worker n'accède jamais à
PostgreSQL, TSPEC.04/ADR.07), mis en cache par TTL. **Aucune liste métier n'est codée en dur** :
tout provient des référentiels (règle d'or 1). Comportement défensif : Backend indisponible ⇒
lexique vide ⇒ texte inchangé ; activable/désactivable par `OCR_LEXICON_CORRECTION`.

> Choix technique : la voie `user_words`/`reinitialize` de Tesseract a été écartée — elle
> n'apporte quasiment rien au moteur LSTM et provoque un crash du core WASM sur modèles
> « best » (`Aborted: missing DotProductSSE`). La correction post-OCR, déterministe et pilotée
> par les référentiels, atteint le même objectif sans toucher au moteur.

---

# OCR Post Processor

Responsabilités :

- normalisation Unicode ;
- suppression des espaces inutiles ;
- homogénéisation des fins de ligne ;
- nettoyage des caractères parasites.

Aucune interprétation métier.

---

# Contrat OCRResult

Le Worker publie exclusivement :

```typescript
export interface OCRResult {

    importJobId: string;

    rawText: string;

    confidence: number;

    processingTimeMs: number;

    pageCount: number;

    language: string;

    engine: string;

    engineVersion: string;

    correlationId: string;

}
```

Ce contrat est partagé dans :

```
shared/contracts
```

---

# Artefacts

Le Worker conserve :

- document original ;
- image prétraitée ;
- texte OCR.

Ces artefacts sont utilisés pour :

- débogage ;
- comparaison ;
- rejeu ;
- amélioration des algorithmes.

---

# Gestion des erreurs

Erreurs possibles :

- document absent ;
- format invalide ;
- OCR impossible ;
- timeout.

Le Job passe à FAILED.

---

# Retry

BullMQ gère :

- retry ;
- backoff ;
- délai.

---

# Logging

Toutes les étapes utilisent :

CorrelationId

Chaque composant journalise :

- début ;
- fin ;
- durée ;
- erreur.

---

# Monitoring

Chaque étape publie :

- temps de chargement ;
- temps prétraitement ;
- temps OCR ;
- temps post-traitement ;
- durée totale.

---

# Scalabilité

Chaque Worker traite un Job.

Le nombre d'instances est libre.

Aucun état local n'est conservé.

---

# Dépendances interdites

Le Worker ne dépend jamais :

- du Backend ;
- de Prisma ;
- de PostgreSQL ;
- des référentiels métier.

---

# Critères d'acceptation

CA-001

Le Worker produit un OCRResult.

---

CA-002

Le résultat est indépendant de Tesseract.

---

CA-003

Tous les échanges utilisent les contrats partagés.

---

CA-004

Le Worker est totalement stateless.

---

CA-005

Chaque sous-composant possède une responsabilité unique.

---

# Documents liés

TSPEC.03

TSPEC.05

ADR Shared Contracts

ADR Single Technology

---

# Historique

|Version|Description|
|-------|-----------|
|0.1|Première rédaction.|
|0.2|Pipeline interne, contrats partagés, séparation Loader / Preprocessor / OCR / PostProcessor.|
| 1.0 | Spécification validée pour la V1. |
