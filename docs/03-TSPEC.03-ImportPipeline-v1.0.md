# Pipeline d'Import

**Document** : TSPEC.03
**Fichier** : 03-TSPEC.03-ImportPipeline-v1.0.md
**Version** : 1.0
**Statut** : Validé

---

# Objectif

Définir l'architecture technique du pipeline d'import.

Le pipeline transforme un document acquis en un EventCandidate.

Le pipeline est entièrement asynchrone.

Chaque composant possède une responsabilité unique.

Le Backend orchestre le pipeline sans réaliser ni OCR ni classification.

---

# Principes

Le pipeline respecte les principes suivants :

- architecture orientée contrats ;
- composants indépendants ;
- traitements asynchrones ;
- idempotence ;
- traçabilité complète ;
- conservation des artefacts ;
- aucune IA générative.

---

# Vue générale

```text
                 Acquisition

                      │

                      ▼

                 Attachment

                      │

                      ▼

                ImportRequest

                      │

                      ▼

                 OCR Worker

                      │

                      ▼

                  OCRResult

                      │

                      ▼

             Classifier Worker

                      │

                      ▼

             ClassificationResult

                      │

                      ▼

               EventCandidate

                      │

                      ▼

            Validation utilisateur

                      │

                      ▼

                    Event
```

---

# Contrats

Tous les échanges utilisent exclusivement les contrats présents dans :

```text
shared/contracts
```

Aucun composant ne dépend des objets internes d'un autre composant.

---

# Contrat ImportRequest

Le Backend publie un Job contenant uniquement :

```typescript
export interface ImportRequest {

    importJobId: string;

    attachmentId: string;

    correlationId: string;

}
```

Le Worker recharge ensuite toutes les données nécessaires.

---

# Étape 1 — Acquisition

Les modes d'acquisition V1 sont :

- sélection de fichier ;
- glisser-déposer.

Les deux utilisent le même endpoint REST.

Formats :

- PNG
- JPG
- JPEG
- PDF

Le document est immédiatement stocké dans MinIO.

Une entrée Attachment est créée.

---

# Étape 2 — ImportJob

Le Backend crée :

- ImportJob
- status = PENDING

Puis publie :

```text
ImportRequest
```

dans :

```
OCR_QUEUE
```

La requête HTTP est terminée.

---

# Étape 3 — OCR Worker

Entrée :

```
ImportRequest
```

Responsabilités :

- charger le document ;
- prétraiter l'image ;
- exécuter OCR ;
- publier OCRResult.

Le Worker ne connaît aucun élément métier.

---

# Prétraitement

Selon le document :

- rotation ;
- deskew ;
- contraste ;
- grayscale ;
- binarisation ;
- réduction du bruit.

Toutes les étapes sont indépendantes.

---

# Contrat OCRResult

Le Worker publie :

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

Ce contrat constitue l'unique dépendance du Worker de classification.

---

# Étape 4 — Classification

Entrée :

```
OCRResult
```

Le Worker applique uniquement :

- référentiels ;
- alias ;
- regex ;
- heuristiques ;
- règles métier.

---

# Contrat ClassificationResult

Le Worker produit :

```typescript
export interface ClassificationResult {

    importJobId: string;

    extractedFields: ...

    confidenceByField: ...

    correlationId: string;

}
```

Aucune écriture Event n'est réalisée.

---

# EventCandidate

Le Backend transforme :

```
ClassificationResult

↓

EventCandidate
```

Le statut devient :

```
PENDING
```

---

# Validation

L'utilisateur peut :

- corriger ;
- valider ;
- rejeter.

La validation produit :

```
Event
```

Le Candidate reste archivé.

---

# Conservation des artefacts

Le pipeline conserve :

- document original ;
- image prétraitée ;
- texte OCR ;
- résultat OCR ;
- résultat de classification.

Ces données permettent :

- débogage ;
- rejeu de la classification ;
- comparaison des versions du moteur OCR ;
- amélioration des heuristiques.

---

# États

ImportJob

```
PENDING

OCR_RUNNING

OCR_DONE

CLASSIFICATION_RUNNING

READY_FOR_VALIDATION

COMPLETED

FAILED
```

EventCandidate

```
PENDING

CORRECTED

VALIDATED

REJECTED
```

---

# Retry

BullMQ gère automatiquement :

- retry ;
- backoff ;
- délai.

Les paramètres sont configurables.

---

# Logging

Tous les contrats transportent :

```
correlationId
```

Le suivi est continu :

```
Acquisition

↓

OCR

↓

Classification

↓

Validation
```

---

# Monitoring

Chaque composant publie :

- durée ;
- erreurs ;
- temps moyen ;
- nombre de Jobs ;
- retry.

---

# Scalabilité

Les Workers sont totalement stateless.

Ils peuvent être répliqués horizontalement.

Chaque Worker traite un Job indépendamment.

---

# Règles d'architecture

Le Backend :

✔ orchestre

✘ ne fait jamais d'OCR

✘ ne fait jamais de classification

---

OCR Worker

✔ OCR

✘ aucune règle métier

---

Classifier Worker

✔ classification

✘ aucun OCR

✘ aucune persistance Event

---

# Critères d'acceptation

CA-001

Le pipeline est entièrement asynchrone.

---

CA-002

Tous les échanges utilisent des contrats partagés.

---

CA-003

Les Workers sont indépendants.

---

CA-004

Le Backend ne dépend d'aucune technologie OCR.

---

CA-005

Le Domain est toujours déduit de l'Activity.

---

CA-006

Tous les artefacts intermédiaires sont conservés.

---

CA-007

Le pipeline peut être rejoué sans retraitement OCR.

---

# Documents liés

TSPEC.01

TSPEC.02

TSPEC.04

TSPEC.05

ADR — Shared Contracts

ADR — Single Technology per Responsibility

---

# Historique

| Version | Description |
|----------|-------------|
|0.1|Première rédaction.|
|0.2|Acquisition, Drag & Drop, OCRResult.|
|0.3|Architecture orientée contrats, ImportRequest, ClassificationResult, shared/contracts, conservation des artefacts.|
| 1.0 | Spécification validée pour la V1. |
