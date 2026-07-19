# Reference Data

**Document** : TSPEC.08

**Fichier** : 03-TSPEC.08-ReferenceData-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Reference Data**.

Le domaine est responsable de la gestion des données de référence utilisées par l'ensemble de la plateforme.

Les référentiels garantissent la cohérence, l'unicité et la qualité des données communes.

Ils constituent une fondation technique de l'architecture.

---

# Responsabilités

Le domaine Reference Data est responsable de :

- gérer les données de référence ;
- garantir leur cohérence ;
- maintenir leur cycle de vie ;
- exposer les référentiels aux autres domaines.

Le domaine n'est pas responsable :

- des événements ;
- des recommandations ;
- du planning ;
- des publications ;
- des recherches.

---

# Position dans l'architecture

```text
                Reference Data
      ┌──────────┼───────────┬──────────┐
      ▼          ▼           ▼          ▼
 Catalog   Publishing   Discovery   Recommendation
```

Tous les domaines consomment les référentiels.

Reference Data ne dépend d'aucun domaine métier.

---

# Structure du module

```text
ReferenceData

├── Domain
│   ├── Aggregates
│   ├── Entities
│   ├── ValueObjects
│   ├── Validation
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
│   ├── Import
│   └── Messaging
│
└── API
```

---

# Modèle métier

Le domaine manipule plusieurs familles de référentiels.

```text
Reference

├── Activities
├── Categories
├── Organizers
├── Venues
├── Municipalities
├── Regions
├── Countries
└── Tags
```

Chaque famille constitue un agrégat indépendant.

Les autres domaines ne manipulent que leurs identifiants.

---

# Principes

Les référentiels sont :

- uniques ;
- partagés ;
- versionnés ;
- réutilisables.

Ils ne sont jamais dupliqués dans les autres domaines.

---

# Interfaces publiques (Ports)

## ReferenceQueryService

Permet notamment :

- obtenir une référence ;
- rechercher une référence ;
- lister un référentiel ;
- vérifier une valeur.

---

## ReferenceCommandService

Permet notamment :

- créer ;
- modifier ;
- désactiver ;
- archiver.

---

## ReferenceRepository

Responsable de la persistance.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Create Reference
- Update Reference
- Archive Reference
- Restore Reference
- Get Reference
- List References
- Validate Reference

---

# Validation

Avant toute modification, le domaine vérifie notamment :

- unicité ;
- cohérence ;
- intégrité ;
- relations entre référentiels.

Les règles sont centralisées dans ce domaine.

---

# Flux principaux

## Consultation

```text
Catalog

↓

ReferenceData

↓

Reference
```

---

## Publication

```text
Publishing

↓

ReferenceData

↓

Validation
```

---

## Recherche

```text
Discovery

↓

ReferenceData

↓

Facets
```

---

# Événements du domaine

Le domaine publie notamment :

```text
ReferenceCreated

ReferenceUpdated

ReferenceArchived

ReferenceRestored
```

Les domaines consommateurs peuvent synchroniser leurs caches ou leurs index.

---

# Dépendances techniques

Le domaine dépend uniquement de :

```text
Persistence

Messaging
```

Il ne dépend d'aucun domaine métier.

Les autres domaines consomment exclusivement ses interfaces publiques.

---

# Gestion des données

Reference Data est propriétaire :

- des référentiels ;
- de leur historique ;
- de leur cycle de vie.

Les autres domaines ne stockent que les identifiants des références.

Aucune duplication métier n'est autorisée.

---

# Sécurité

Les modifications sont réservées aux utilisateurs autorisés.

Les opérations de consultation sont accessibles selon les besoins des domaines consommateurs.

Les contrôles RBAC restent assurés par Identity.

---

# Performance

Le domaine est optimisé pour :

- les lectures très fréquentes ;
- les écritures peu nombreuses ;
- une forte stabilité des données.

Les référentiels peuvent être mis en cache par les domaines consommateurs.

---

# Observabilité

Le domaine expose notamment :

- nombre de références ;
- créations ;
- modifications ;
- archivages ;
- erreurs de validation ;
- durée moyenne des consultations.

Toutes les modifications sont historisées.

---

# Contraintes

Reference Data respecte les principes suivants.

- une référence possède un identifiant unique ;
- une référence n'est définie qu'une seule fois ;
- aucune logique métier spécifique n'est implémentée ;
- les référentiels sont indépendants des domaines consommateurs ;
- les identifiants sont stables.

Toute évolution de ces principes nécessite un ADR.

---

# Évolutions

La V3 pourra intégrer :

- hiérarchies complexes ;
- synonymes ;
- taxonomies enrichies ;
- gestion multilingue ;
- gouvernance avancée des référentiels.

Ces évolutions ne modifieront pas la responsabilité fondamentale du domaine.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

03-TSPEC.04-Discovery-v2.0

03-TSPEC.05-Publishing-v2.0

02-FSPEC.07-ReferenceData-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Reference Data. |