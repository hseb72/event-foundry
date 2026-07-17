# Expert Classification Worker

**Document** : TSPEC.05
**Fichier** : 03-TSPEC.05-ClassifierWorker-v0.1.md
**Version** : 0.1
**Statut** : Draft

---

# Objectif

Transformer un résultat OCR (`OCRResult`) en une représentation métier (`ClassificationResult`).

Le Worker applique exclusivement des règles déterministes.

Aucune intelligence artificielle générative n'est utilisée.

---

# Responsabilités

Entrée :

```
OCRResult
```

Sortie :

```
ClassificationResult
```

Le Worker :

- interprète le texte ;
- reconnaît les entités métier ;
- calcule les scores de confiance ;
- produit un résultat structuré.

Il ne réalise jamais :

- OCR ;
- persistance ;
- validation utilisateur.

---

# Principes

Le moteur respecte les principes suivants :

- architecture orientée règles ;
- architecture orientée contrats ;
- déterminisme ;
- idempotence ;
- indépendance des règles ;
- aucune connaissance codée en dur.

---

# Architecture

```text
               OCRResult

                    │

                    ▼

          Rule Pipeline Engine

                    │

      ┌─────────────┼─────────────┐

      ▼             ▼             ▼

 Date Rule    Activity Rule   Venue Rule

      ▼             ▼             ▼

 Organizer Rule  Format Rule  URL Rule

      ▼

 Confidence Engine

      ▼

 ClassificationResult
```

Chaque règle est indépendante.

---

# Pipeline de règles

Chaque règle :

- reçoit un contexte ;
- lit uniquement les données utiles ;
- enrichit le contexte ;
- ne modifie jamais le travail des autres règles.

Les règles sont exécutées dans un ordre configurable.

---

# Contexte

Toutes les règles travaillent sur un objet partagé.

```typescript
interface ClassificationContext {

    ocr: OCRResult;

    extractedFields;

    confidenceByField;

    diagnostics;

}
```

Le contexte n'est jamais exposé à l'extérieur du Worker.

---

# Sources de connaissance

Le moteur expert utilise uniquement :

- Domain
- Activity
- EventType
- EventFormat
- Organizer
- Venue
- Alias

Toutes les connaissances proviennent des référentiels.

Aucune liste codée en dur n'est autorisée.

---

# Règles

Chaque règle possède une responsabilité unique.

Exemples :

```
DateRule

TimeRule

ActivityRule

OrganizerRule

VenueRule

PriceRule

UrlRule

CapacityRule
```

---

# Déduction

Certaines informations sont calculées.

Exemple :

```
Activity

↓

Domain
```

Le Domain n'est jamais recherché directement.

---

# Calcul des confiances

Chaque règle calcule son propre score.

Exemple :

```
title

0.98

venue

0.72

date

1.00
```

Les scores sont indépendants.

Aucun score global n'est calculé.

---

# Contrat ClassificationResult

Le Worker publie :

```typescript
interface ClassificationResult {

    importJobId: string;

    extractedFields;

    confidenceByField;

    diagnostics;

    correlationId: string;

}
```

Le contrat est partagé via :

```
shared/contracts
```

---

# Diagnostics

Chaque règle peut produire :

- avertissement ;
- ambiguïté ;
- erreur de reconnaissance.

Ces informations facilitent la revue utilisateur.

---

# Alias

Les règles utilisent les alias.

Exemple :

```
MTG

↓

Magic

↓

Activity
```

---

# Référentiels

Les référentiels sont chargés au démarrage.

Ils sont rafraîchis automatiquement lors de leur mise à jour.

Le Worker ne nécessite pas de redémarrage.

---

# Performance

Chaque règle est indépendante.

Les nouvelles règles peuvent être ajoutées sans modifier les anciennes.

---

# Logging

Chaque règle journalise :

- début ;
- durée ;
- résultat.

---

# Monitoring

Le Worker publie notamment :

- temps de classification ;
- nombre de règles exécutées ;
- ambiguïtés détectées ;
- confiance moyenne par champ ;
- taux d'échec par règle.

---

# Dépendances interdites

Le Worker ne dépend jamais :

- de Prisma ;
- de PostgreSQL ;
- d'Angular ;
- de Tesseract.

---

# Critères d'acceptation

CA-001

Toutes les règles sont indépendantes.

---

CA-002

Aucune règle ne contient de données métier codées en dur.

---

CA-003

Le Domain est toujours déduit de l'Activity.

---

CA-004

Chaque champ possède son propre score de confiance.

---

CA-005

Les nouvelles règles peuvent être ajoutées sans modifier les règles existantes.

---

CA-006

Le Worker produit exclusivement un `ClassificationResult`.

---

# Documents liés

TSPEC.03

TSPEC.04

FSPEC.07

ADR Shared Contracts

ADR Single Technology

---

# Historique

|Version|Description|
|-------|-----------|
|0.1|Première rédaction.|