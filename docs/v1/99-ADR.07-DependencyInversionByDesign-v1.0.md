# ADR.07 — Dependency Inversion by Design

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

EventFoundry est composé de plusieurs composants indépendants :

- Backend
- OCR Worker
- Expert Classification Worker
- Frontend
- Infrastructure de persistance
- Services techniques

Ces composants évolueront à des rythmes différents.

Le remplacement d'une technologie, l'ajout d'un nouveau Worker ou l'évolution d'une implémentation ne doivent jamais imposer des modifications en cascade dans le reste du système.

Une dépendance directe aux implémentations créerait un couplage fort et limiterait l'évolutivité de la plateforme.

---

# Décision

Toutes les dépendances entre composants reposent sur des abstractions définies par le projet.

Les composants ne dépendent jamais directement d'une technologie, d'une implémentation concrète ou d'un détail d'infrastructure.

Les abstractions constituent les frontières officielles du système.

---

# Principes

Les composants dépendent :

- d'interfaces ;
- de contrats partagés ;
- de ports d'accès ;
- d'abstractions métier.

Ils ne dépendent jamais :

- d'une implémentation concrète ;
- d'un framework ;
- d'une bibliothèque tierce ;
- d'un composant interne appartenant à une autre couche.

---

# Applications dans EventFoundry

## Persistance

Le Backend dépend de :

```
Repository
```

et jamais de :

```
Prisma Client
```

Le remplacement de Prisma ne doit impacter que la couche Repository.

---

## OCR

Le Worker dépend de :

```
ImageProcessor
```

et jamais directement de :

```
OpenCV
```

Le moteur OCR dépend d'une abstraction et non d'une bibliothèque spécifique de traitement d'image.

---

## Classification

Le moteur dépend de :

```
ClassificationRule
```

et jamais de :

```
DateRule

VenueRule

ActivityRule
```

Le moteur orchestre uniquement une collection de règles.

---

## Communication

Les composants échangent exclusivement via :

```
shared/contracts
```

Ils ne partagent jamais leurs modèles internes.

---

## Pipeline

Les traitements échangent des contrats :

```
ImportRequest

↓

OCRResult

↓

ClassificationResult
```

Le pipeline ne transporte jamais des objets métiers internes.

---

## Infrastructure

Les composants utilisent :

- BullMQ
- PostgreSQL
- Redis
- MinIO

uniquement derrière des services ou des abstractions définies par le projet lorsque cela est pertinent.

Les technologies restent des détails d'implémentation.

---

# Alternatives considérées

## Dépendances directes

Exemples :

- Services utilisant Prisma Client ;
- Classifier utilisant directement Tesseract ;
- partage des entités Prisma entre composants.

Rejeté.

Cette approche augmente fortement le couplage et complique les évolutions.

---

## Abstractions uniquement lorsque nécessaire

Rejeté.

Cette approche conduit rapidement à une architecture incohérente où certaines couches sont découplées et d'autres non.

Le projet adopte une règle uniforme.

---

# Conséquences

## Avantages

- architecture homogène ;
- faible couplage ;
- forte testabilité ;
- remplacement facilité des technologies ;
- meilleure évolutivité ;
- séparation claire des responsabilités ;
- simplification des tests unitaires grâce aux mocks et stubs.

---

## Inconvénients

- davantage d'interfaces à maintenir ;
- légère complexité initiale supplémentaire ;
- nécessité d'une discipline de développement.

Ces coûts sont jugés largement inférieurs aux bénéfices à moyen et long terme.

---

# Exemples

| Couche | Dépend de | Ne dépend jamais de |
|---------|-----------|---------------------|
| Backend | Repository | Prisma Client |
| OCR Worker | ImageProcessor | OpenCV |
| OCR Worker | OCREngine | Tesseract |
| Expert Worker | ClassificationRule | DateRule |
| Workers | shared/contracts | Entités Backend |
| API | DTO | Entités Prisma |

---

# Relation avec les autres ADR

Cette ADR constitue un principe transversal qui sous-tend plusieurs décisions d'architecture :

- ADR.02 — Prisma ORM
- ADR.03 — Shared Contracts
- ADR.04 — Single Technology per Responsibility
- ADR.06 — Rule Engine Architecture

Elle formalise le principe général qui motive ces décisions.

---

# Documents impactés

- TSPEC.01
- TSPEC.02
- TSPEC.03
- TSPEC.04
- TSPEC.05
- TSPEC.06
- TSPEC.07

---

# Conclusion

L'architecture d'EventFoundry est construite selon le principe suivant :

> **Les composants dépendent d'abstractions définies par le projet, jamais des technologies qui les implémentent.**

Les technologies sont considérées comme des détails d'implémentation.

Les interfaces, contrats et abstractions constituent les véritables fondations de la plateforme.