# Gestion des EventCandidate

**Document** : FSPEC.02  
**Fichier** : 02-FSPEC.02-EventCandidates-v1.0.md  
**Version** : 1.0  
**Statut** : Validé

---

# Objectif

Permettre à l'utilisateur de consulter, corriger, valider ou rejeter les événements proposés automatiquement par le moteur expert.

Cette fonctionnalité constitue l'interface entre le traitement automatique et la création d'un Event.

---

# Périmètre

Cette spécification couvre :

- la consultation des EventCandidate ;
- leur modification ;
- leur validation ;
- leur rejet ;
- leur historique de traitement.

Ne couvre pas :

- l'import des documents (FSPEC.01) ;
- la consultation des Events (FSPEC.03).

---

# Acteurs

## Utilisateur

Analyse les propositions du moteur.

Corrige les informations si nécessaire.

Décide de valider ou de rejeter chaque EventCandidate.

---

## Backend

Assure la cohérence des traitements.

Crée les Events.

---

# Préconditions

Un ImportJob est terminé.

Au moins un EventCandidate a été produit.

---

# Workflow nominal

```text
Import terminé

↓

EventCandidate(s)

↓

Consultation

↓

Correction éventuelle

↓

Validation

↓

Création Event
```

Workflow alternatif :

```text
Consultation

↓

Rejet

↓

Archivage
```

---

# Cycle de vie

```text
PENDING

↓

CORRECTED

↓

VALIDATED

↓

REJECTED
```

Les transitions autorisées sont :

```
PENDING
    ├──► CORRECTED
    ├──► VALIDATED
    └──► REJECTED

CORRECTED
    ├──► VALIDATED
    └──► REJECTED
```

Un EventCandidate validé ou rejeté ne peut plus être modifié.

---

# Cas d'utilisation

## UC01 — Consulter un EventCandidate

L'utilisateur consulte :

- le document original ;
- le texte OCR ;
- les informations détectées ;
- le score de confiance.

---

## UC02 — Corriger un EventCandidate

L'utilisateur peut modifier :

- titre ;
- description ;
- dates ;
- heures ;
- Domain ;
- Activity ;
- EventType ;
- EventFormat ;
- Organizer ;
- Venue ;
- prix.

Chaque modification est conservée avant validation.

Le statut devient **CORRECTED**.

---

## UC03 — Valider un EventCandidate

Le système :

- contrôle les données ;
- crée un Event ;
- marque le candidat **VALIDATED**.

---

## UC04 — Rejeter un EventCandidate

Le système :

- conserve le candidat ;
- passe son statut à **REJECTED**.

Aucune suppression n'est réalisée.

---

# Règles métier

RM-001

Chaque EventCandidate appartient à un seul ImportJob.

---

RM-002

Un ImportJob peut produire plusieurs EventCandidate.

---

RM-003

Chaque EventCandidate peut produire au plus un Event.

---

RM-004

La validation crée immédiatement un Event.

---

RM-005

Les corrections sont enregistrées avant validation.

---

RM-006

Le texte OCR n'est jamais modifié.

---

RM-007

Le document d'origine n'est jamais modifié.

---

RM-008

Le score de confiance reste consultable après correction.

---

RM-009

Les EventCandidate validés et rejetés sont conservés pour audit.

---

# Interfaces utilisateur

## Liste des EventCandidate

Affiche :

- statut ;
- titre proposé ;
- date ;
- Activity ;
- score global.

Filtres :

- statut ;
- Activity ;
- période ;
- ImportJob.

---

## Détail d'un EventCandidate

Affiche :

- document original ;
- texte OCR ;
- informations extraites ;
- score de confiance par champ.

L'utilisateur peut :

- modifier ;
- valider ;
- rejeter.

---

# API concernées

```
GET /api/v1/event-candidates

GET /api/v1/event-candidates/{id}

PUT /api/v1/event-candidates/{id}

POST /api/v1/event-candidates/{id}/validate

POST /api/v1/event-candidates/{id}/reject

GET /api/v1/imports/{id}/event-candidates
```

---

# Tables concernées

- import_jobs
- event_candidates
- events

---

# Critères d'acceptation

CA-001

Un EventCandidate est consultable après un import.

---

CA-002

L'utilisateur peut corriger chaque champ.

---

CA-003

Le statut devient **CORRECTED** après modification.

---

CA-004

La validation crée un Event.

---

CA-005

Le statut devient **VALIDATED**.

---

CA-006

Le rejet conserve le candidat.

---

CA-007

Le statut devient **REJECTED**.

---

CA-008

Une affiche contenant plusieurs événements permet de valider chaque candidat indépendamment.

---

# Tests fonctionnels

TF-001

Ouvrir un EventCandidate.

Résultat attendu :

Toutes les informations sont visibles.

---

TF-002

Modifier l'Activity.

Résultat attendu :

Le statut passe à **CORRECTED**.

---

TF-003

Valider un candidat.

Résultat attendu :

Un Event est créé.

---

TF-004

Rejeter un candidat.

Résultat attendu :

Le candidat reste consultable.

---

TF-005

Importer une affiche contenant trois événements.

Résultat attendu :

Les trois candidats peuvent être validés ou rejetés indépendamment.

---

# Documents liés

- VISION
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.01
- FSPEC.03

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 1.0 | Spécification validée pour la V1. |
