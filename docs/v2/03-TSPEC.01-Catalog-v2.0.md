# Catalog

**Document** : TSPEC.01

**Fichier** : 03-TSPEC.01-Catalog-v2.0.md

**Version** : 2.1

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Catalog**.

Le Catalog constitue le référentiel central des événements publiés de la plateforme.

Il expose les services nécessaires aux autres domaines tout en restant indépendant de leurs règles métier.

Le Catalog est une ressource technique commune.

---

# Responsabilités

Le domaine Catalog est responsable de :

- gérer le cycle de vie des événements publiés ;
- garantir leur unicité ;
- assurer leur cohérence ;
- exposer leur consultation ;
- publier les évolutions significatives.

Le Catalog n'est pas responsable :

- des recommandations ;
- du planning ;
- de la recherche avancée ;
- des notifications ;
- des permissions.

---

# Position dans l'architecture

```text
                 Publishing
                      │
                      ▼
                  Catalog
      ┌──────────┬────┴────┬──────────┐
      ▼          ▼         ▼          ▼
    Search   Discovery Recommendation Planning
```

Le Catalog constitue le cœur documentaire de la plateforme.

Tous les autres domaines consomment ses données sans pouvoir les modifier directement.

---

# Structure du module

Le domaine est organisé selon une architecture en couches.

```text
Catalog

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
│   ├── Messaging
│   ├── Search
│   └── Mapping
│
└── API
    ├── REST
    └── Internal
```

Chaque couche possède une responsabilité clairement définie.

Les dépendances restent orientées vers le domaine.

---

# Modèle métier

Le Catalog est construit autour d'un agrégat principal.

```text
Event
```

L'agrégat regroupe les concepts suivants :

```text
Event

├── Identity
├── Publication
├── Schedule
├── Location
├── Organizer
├── Classification
└── Metadata
```

Les référentiels restent externes au domaine.

Le Catalog conserve uniquement leurs identifiants.

---

# Interfaces publiques (Ports)

Le domaine expose les interfaces suivantes.

## Consultation

```text
CatalogQueryService
```

Permet :

- obtenir un événement ;
- consulter plusieurs événements ;
- vérifier l'existence d'un événement.

---

## Administration

```text
CatalogCommandService
```

Permet :

- publier ;
- modifier ;
- archiver.

---

## Persistance

```text
CatalogRepository
```

Abstraction de l'accès aux données.

Le domaine ne dépend jamais d'une technologie de stockage.

---

# Cas d'utilisation

Le domaine implémente notamment les cas d'utilisation suivants.

- Publish Event
- Update Event
- Archive Event
- Get Event
- List Events
- Verify Event
- Restore Event

---

# Flux principaux

## Publication

```text
Organizer

↓

Publishing

↓

Catalog

↓

EventPublished
```

---

## Mise à jour

```text
Organizer

↓

Publishing

↓

Catalog

↓

EventUpdated
```

---

## Consultation

```text
Explorer

↓

Discovery

↓

Search

↓

Catalog
```

---

# Événements du domaine

Le Catalog publie les événements suivants.

```text
EventPublished

EventUpdated

EventArchived
```

Ces événements permettent aux autres domaines de maintenir leur propre cohérence.

Ils ne contiennent que les informations nécessaires.

---

# Dépendances techniques

Le domaine dépend uniquement des contrats publics suivants.

```text
ReferenceData API

Storage

Search Index

Messaging
```

Aucune dépendance inverse n'est autorisée.

Les autres domaines consomment exclusivement les interfaces publiques.

---

# Gestion des données

Le Catalog est propriétaire de ses données.

Aucun autre domaine ne peut :

- modifier directement les événements ;
- accéder au stockage ;
- contourner les services applicatifs.

Toutes les écritures transitent par les cas d'utilisation.

---

# Sécurité

Le contrôle des permissions est réalisé avant l'appel des services du Catalog.

Le domaine suppose que les autorisations ont déjà été validées.

Le Catalog reste indépendant du mécanisme d'authentification.

---

# Performance

Le domaine est optimisé pour :

- les lectures fréquentes ;
- les écritures modérées ;
- la stabilité des identifiants.

Les optimisations de recherche sont déléguées au domaine Search.

---

# Observabilité

Le domaine expose notamment les indicateurs suivants.

- nombre d'événements ;
- événements publiés ;
- événements archivés ;
- événements mis à jour ;
- durée moyenne des lectures ;
- durée moyenne des écritures ;
- taux d'erreur.

Les journaux permettent de tracer l'ensemble des opérations d'administration.

---

# Contraintes

Le Catalog respecte les principes suivants.

- un événement possède un identifiant unique ;
- un événement n'existe qu'une seule fois ;
- aucune personnalisation n'est stockée ;
- aucune logique de recommandation n'est implémentée ;
- aucune logique de planning n'est implémentée ;
- aucune logique de présentation n'est implémentée.

Le Catalog demeure exclusivement le patrimoine documentaire de la plateforme.

---

# Évolutions

Les évolutions futures du Catalog devront préserver :

- la stabilité des identifiants ;
- l'indépendance vis-à-vis des domaines consommateurs ;
- la séparation entre données documentaires et traitements métier.

Toute évolution remettant en cause ces principes devra faire l'objet d'un ADR.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

02-FSPEC.14-Catalog-v2.0

02-FSPEC.13-Publishing-v2.0

02-FSPEC.12-Discovery-v2.0

02-FSPEC.09-RecommendationEngine-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Catalog. |
| 2.1 | Harmonisation du template TSPEC : structure du module, ports, cas d'utilisation, flux, modèle métier et dépendances techniques. |