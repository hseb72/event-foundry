# Gestion des Imports

**Document** : FSPEC.01  
**Fichier** : 02-FSPEC.01-Imports-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Objectif

Permettre à un utilisateur d'importer une annonce d'événement sous forme d'image ou de texte afin que le système produise automatiquement un ou plusieurs **EventCandidate** prêts à être validés.

Cette fonctionnalité constitue le point d'entrée de tous les événements de la plateforme.

---

# Périmètre

Cette spécification couvre :

- l'import d'une image ;
- l'import d'un texte ;
- le stockage du document d'origine ;
- la création d'un ImportJob ;
- le lancement du pipeline OCR ;
- le lancement du moteur de classification ;
- la création d'un ou plusieurs EventCandidate.

Ne sont pas couverts :

- la validation des EventCandidate (FSPEC.02) ;
- la gestion des Events (FSPEC.03).

---

# Acteurs

## Utilisateur

Déclenche un import.

---

## Backend

Orchestre le traitement.

---

## OCR Worker

Produit le texte OCR.

---

## Classifier Worker

Produit les EventCandidate.

---

# Préconditions

L'utilisateur est authentifié.

Les référentiels nécessaires sont disponibles.

Les services MinIO, PostgreSQL, Redis et les Workers sont opérationnels.

---

# Workflow nominal

```text
Utilisateur

↓

Sélection d'une image ou saisie d'un texte

↓

Upload

↓

Création Attachment

↓

Création ImportJob

↓

Publication Job OCR

↓

OCR terminé

↓

Publication Job Classification

↓

Classification terminée

↓

Création d'un ou plusieurs EventCandidate

↓

Import terminé
```

---

# Cas d'utilisation

## UC01 — Import d'une image

L'utilisateur sélectionne une image.

Le système :

- stocke l'image dans MinIO ;
- crée un Attachment ;
- crée un ImportJob ;
- démarre le traitement OCR.

Résultat attendu :

Le pipeline démarre automatiquement.

---

## UC02 — Import d'un texte

L'utilisateur colle un texte.

Le système :

- crée un Attachment de type texte ;
- crée un ImportJob ;
- démarre directement la classification.

Aucun OCR n'est exécuté.

---

# États d'un ImportJob

```text
PENDING

↓

OCR_RUNNING

↓

OCR_DONE

↓

CLASSIFICATION_RUNNING

↓

READY_FOR_VALIDATION

↓

COMPLETED
```

En cas d'erreur :

```text
FAILED
```

---

# Règles métier

RM-001

Chaque import crée exactement un ImportJob.

---

RM-002

Chaque ImportJob référence exactement un Attachment.

---

RM-003

Un ImportJob peut produire plusieurs EventCandidate.

---

RM-004

Le document d'origine est toujours conservé.

---

RM-005

Le texte OCR est conservé afin de permettre un retraitement.

---

RM-006

Le pipeline est entièrement asynchrone.

Le frontend ne doit jamais attendre la fin du traitement.

---

RM-007

Un import texte ne déclenche jamais l'OCR.

---

# Interfaces utilisateur

## Vue Import

Permet :

- sélectionner une image ;
- coller un texte ;
- lancer l'import.

---

## Liste des imports

Affiche :

- date d'import ;
- type (image / texte) ;
- état ;
- nombre de EventCandidate produits.

---

## Détail d'un import

Affiche :

- document original ;
- texte OCR ;
- historique des traitements ;
- liste des EventCandidate.

---

# API concernées

```
POST /api/v1/imports

GET /api/v1/imports

GET /api/v1/imports/{id}

GET /api/v1/imports/{id}/event-candidates
```

---

# Tables concernées

- attachments
- import_jobs
- event_candidates

---

# Critères d'acceptation

CA-001

Importer une image crée un ImportJob.

---

CA-002

Importer un texte crée un ImportJob sans exécuter l'OCR.

---

CA-003

Une image contenant plusieurs événements produit plusieurs EventCandidate.

---

CA-004

Le document original est conservé.

---

CA-005

Le texte OCR est consultable.

---

CA-006

L'utilisateur peut consulter la liste des imports.

---

CA-007

L'utilisateur peut consulter le détail d'un import.

---

# Tests fonctionnels

TF-001

Importer une image valide.

Résultat attendu :

ImportJob créé.

---

TF-002

Importer un texte.

Résultat attendu :

Classification exécutée sans OCR.

---

TF-003

Importer une affiche contenant trois événements.

Résultat attendu :

Trois EventCandidate sont créés.

---

TF-004

Consulter le détail d'un import.

Résultat attendu :

Le document, le texte OCR et les EventCandidate sont visibles.

---

# Documents liés

- VISION
- ARCHI.01
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.02

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 1.0 | Spécification validée pour la V1. |
