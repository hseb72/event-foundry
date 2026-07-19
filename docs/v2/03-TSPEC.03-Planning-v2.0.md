# Planning

**Document** : TSPEC.03

**Fichier** : 03-TSPEC.03-Planning-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Planning**.

Le Planning est le domaine responsable de l'organisation personnelle des activités culturelles d'un utilisateur.

Il constitue le cœur de l'expérience Explorer.

Le Planning ne gère pas les événements.

Il gère la relation entre un utilisateur et les événements du Catalog.

---

# Responsabilités

Le Planning est responsable de :

- gérer le planning personnel ;
- enregistrer les décisions utilisateur ;
- détecter les conflits temporels ;
- organiser les activités retenues ;
- exposer le planning aux autres domaines.

Le Planning n'est pas responsable :

- des recommandations ;
- du catalogue ;
- des publications ;
- des notifications ;
- des permissions.

---

# Position dans l'architecture

```text
                 Recommendation
                        │
                        ▼
                  Planning
                 ▲        ▲
                 │        │
            Discovery   Participation
                 │
                 ▼
              Explorer
```

Le Planning centralise les choix de l'utilisateur.

---

# Structure du module

```text
Planning

├── Domain
│   ├── Aggregates
│   ├── Entities
│   ├── ValueObjects
│   ├── DomainServices
│   └── DomainEvents
│
├── Application
│   ├── Commands
│   ├── Queries
│   ├── UseCases
│   └── DTO
│
├── Infrastructure
│   ├── Persistence
│   ├── Catalog
│   ├── Recommendation
│   └── Notifications
│
└── API
```

---

# Modèle métier

Le domaine est construit autour d'un agrégat principal.

```text
PlanningEntry
```

Chaque entrée représente une décision utilisateur.

```text
PlanningEntry

├── User
├── Event
├── Status
├── Source
├── Schedule
└── Metadata
```

Le Planning ne possède jamais l'événement.

Il référence uniquement son identifiant.

---

# États

Une entrée peut évoluer selon plusieurs états.

```text
Suggested

↓

Planned

↓

Confirmed

↓

Completed
```

ou

```text
Suggested

↓

Rejected
```

ou

```text
Planned

↓

Cancelled
```

Les transitions sont contrôlées par le domaine.

---

# Sources

Une entrée du Planning peut provenir de plusieurs domaines.

```text
Recommendation

Discovery

Publication

Import
```

La provenance est conservée afin de garantir la traçabilité.

---

# Interfaces publiques (Ports)

## PlanningQueryService

Permet :

- consulter le planning ;
- obtenir les activités d'une période ;
- rechercher une entrée.

---

## PlanningCommandService

Permet :

- ajouter une activité ;
- confirmer une activité ;
- annuler une activité ;
- supprimer une activité.

---

## PlanningRepository

Responsable de la persistance.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Add Event
- Plan Event
- Confirm Participation
- Cancel Participation
- Remove Event
- Get Planning
- Get Daily Planning
- Get Weekly Planning
- Detect Conflicts

---

# Détection de conflits

Le Planning vérifie automatiquement :

- chevauchements horaires ;
- doublons ;
- événements archivés.

Les temps de trajet ne sont pas pris en compte dans la V2.

Cette évolution est reportée en V3.

---

# Flux principaux

## Depuis une recommandation

```text
Recommendation

↓

Planning

↓

PlanningEntryCreated
```

---

## Depuis Discovery

```text
Discovery

↓

Planning

↓

PlanningEntryCreated
```

---

## Consultation

```text
Explorer

↓

Planning

↓

Planning View
```

---

# Événements du domaine

Le Planning publie notamment :

```text
PlanningEntryCreated

PlanningEntryUpdated

PlanningEntryCancelled

PlanningConflictDetected
```

Ces événements permettent aux autres domaines de réagir.

---

# Dépendances techniques

Le domaine dépend des contrats publics suivants.

```text
Catalog API

Recommendation API

Notification API
```

Le Planning ne dépend jamais directement de Discovery.

Discovery utilise les services du Planning.

---

# Gestion des données

Le Planning est propriétaire :

- des entrées de planning ;
- des états ;
- des décisions utilisateur.

Il ne stocke jamais :

- les événements ;
- les recommandations.

---

# Sécurité

Chaque planning appartient à une identité unique.

Aucune donnée n'est partagée entre utilisateurs.

Les contrôles RBAC sont réalisés avant l'appel des services.

---

# Performance

Le domaine est optimisé pour :

- les consultations fréquentes ;
- les modifications ponctuelles ;
- la détection rapide des conflits.

---

# Observabilité

Le domaine expose notamment :

- nombre d'entrées ;
- événements planifiés ;
- confirmations ;
- annulations ;
- conflits détectés ;
- durée moyenne des traitements.

---

# Contraintes

Le Planning respecte les principes suivants.

- un événement peut apparaître plusieurs fois dans des plannings différents ;
- une entrée appartient à un seul utilisateur ;
- aucune logique de recommandation ;
- aucune logique de publication ;
- aucune personnalisation du Catalog.

Le Planning demeure exclusivement responsable des décisions personnelles de l'utilisateur.

---

# Évolutions

Les évolutions prévues pour la V3 pourront intégrer :

- calcul des temps de trajet ;
- optimisation des déplacements ;
- synchronisation avec des calendriers externes ;
- suggestions contextuelles.

Ces évolutions ne remettent pas en cause le modèle fondamental du Planning.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

03-TSPEC.02-RecommendationEngine-v2.0

02-FSPEC.08-Planning-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Planning. |