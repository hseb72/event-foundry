# Discovery

**Document** : TSPEC.04

**Fichier** : 03-TSPEC.04-Discovery-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Discovery**.

Discovery permet à l'utilisateur d'explorer librement le patrimoine culturel de la plateforme.

Il orchestre les recherches, les filtres, les parcours de découverte et les interactions avec le Planning.

Discovery ne possède aucune donnée documentaire.

---

# Responsabilités

Le domaine Discovery est responsable de :

- orchestrer les recherches ;
- proposer des parcours d'exploration ;
- appliquer les filtres utilisateur ;
- présenter les résultats ;
- faciliter l'ajout d'événements au Planning.

Discovery n'est pas responsable :

- du stockage des événements ;
- de l'indexation ;
- des recommandations ;
- des publications ;
- des notifications.

---

# Position dans l'architecture

```text
               Explorer
                   │
                   ▼
              Discovery
            ┌─────┴─────┐
            ▼           ▼
         Search      Planning
            │
            ▼
         Catalog
```

Discovery constitue la couche d'orchestration de l'expérience Explorer.

---

# Structure du module

```text
Discovery

├── Domain
│   ├── Models
│   ├── Filters
│   ├── Facets
│   ├── Navigation
│   └── DomainEvents
│
├── Application
│   ├── Queries
│   ├── UseCases
│   └── DTO
│
├── Infrastructure
│   ├── Search
│   ├── Planning
│   └── Catalog
│
└── API
```

---

# Modèle métier

Le domaine manipule principalement :

```text
DiscoverySession
```

Une session représente le contexte d'exploration.

```text
DiscoverySession

├── User
├── Query
├── Filters
├── Sorting
├── Results
└── Context
```

Les événements restent dans le Catalog.

---

# Interfaces publiques (Ports)

## DiscoveryQueryService

Permet :

- rechercher ;
- filtrer ;
- explorer ;
- consulter un événement ;
- obtenir des résultats.

Discovery ne propose aucun service d'écriture sur le Catalog.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Search Events
- Browse Catalog
- Apply Filters
- Remove Filters
- View Event
- Add To Planning
- Refresh Results

---

# Flux principaux

## Recherche

```text
Explorer

↓

Discovery

↓

Search

↓

Catalog

↓

Results
```

---

## Consultation

```text
Explorer

↓

Discovery

↓

Catalog
```

---

## Ajout au Planning

```text
Explorer

↓

Discovery

↓

Planning

↓

PlanningEntryCreated
```

Discovery ne modifie jamais directement le Catalog.

---

# Filtres

Discovery applique les filtres sélectionnés par l'utilisateur.

Exemples :

- date ;
- catégorie ;
- activité ;
- commune ;
- organisateur ;
- lieu.

Les critères sont transmis au domaine Search.

---

# Tri

Discovery peut demander différents modes de tri.

Exemples :

- pertinence ;
- date ;
- proximité ;
- nouveauté.

Le calcul du tri est réalisé par Search.

---

# Dépendances techniques

Le domaine dépend des contrats publics suivants.

```text
Search API

Catalog API

Planning API
```

Discovery ne dépend jamais du Recommendation Engine.

Les recommandations disposent de leur propre parcours utilisateur.

---

# Gestion des données

Discovery ne possède aucune donnée métier persistante.

Les résultats sont reconstruits à chaque requête.

Les préférences utilisateur restent dans le domaine Identity.

---

# Sécurité

Discovery applique les règles d'accès définies par les autres domaines.

Il ne réalise aucun contrôle RBAC.

---

# Performance

Le domaine privilégie :

- des temps de réponse faibles ;
- la pagination ;
- le chargement progressif des résultats.

Les optimisations d'indexation restent du ressort du domaine Search.

---

# Observabilité

Le domaine expose notamment :

- nombre de recherches ;
- durée moyenne des recherches ;
- filtres utilisés ;
- consultations d'événements ;
- ajouts au Planning.

---

# Contraintes

Discovery respecte les principes suivants.

- aucune donnée documentaire ;
- aucune logique de recommandation ;
- aucune logique de publication ;
- aucune persistance des événements ;
- aucune modification du Catalog.

Discovery orchestre uniquement l'exploration.

---

# Évolutions

La V3 pourra intégrer :

- parcours culturels ;
- collections ;
- exploration thématique ;
- navigation géographique ;
- découverte contextuelle.

Ces évolutions ne modifieront pas la responsabilité fondamentale du domaine.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

03-TSPEC.03-Planning-v2.0

02-FSPEC.12-Discovery-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Discovery. |