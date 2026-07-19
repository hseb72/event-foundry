# Publishing

**Document** : TSPEC.05

**Fichier** : 03-TSPEC.05-Publishing-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Publishing**.

Publishing est responsable du processus de création, de validation, de publication et d'évolution des événements.

Le domaine pilote le cycle de publication sans devenir propriétaire du patrimoine documentaire.

---

# Responsabilités

Le domaine Publishing est responsable de :

- créer un événement ;
- modifier un événement ;
- valider les informations fournies ;
- piloter le workflow de publication ;
- transmettre les événements publiés au Catalog.

Publishing n'est pas responsable :

- du stockage définitif des événements ;
- des recommandations ;
- du planning ;
- des recherches ;
- des notifications.

---

# Position dans l'architecture

```text
Organizer
     │
     ▼
Publishing
     │
     ▼
 Catalog
     │
     ├────────────┐
     ▼            ▼
Recommendation  Discovery
```

Publishing constitue la porte d'entrée des événements.

---

# Structure du module

```text
Publishing

├── Domain
│   ├── Aggregates
│   ├── Entities
│   ├── ValueObjects
│   ├── Policies
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
│   ├── Catalog
│   ├── ReferenceData
│   ├── Storage
│   └── Messaging
│
└── API
```

---

# Modèle métier

Le domaine manipule un agrégat principal.

```text
Publication
```

```text
Publication

├── Organizer
├── EventDraft
├── Status
├── Validation
├── PublicationDate
└── Metadata
```

Une publication représente un travail en cours.

L'événement publié appartient ensuite au Catalog.

---

# Cycle de vie

```text
Draft

↓

Submitted

↓

Validated

↓

Published

↓

Updated

↓

Archived
```

Les transitions sont contrôlées par le domaine.

---

# Interfaces publiques (Ports)

## PublishingCommandService

Permet :

- créer une publication ;
- modifier une publication ;
- soumettre une publication ;
- publier ;
- archiver.

---

## PublishingQueryService

Permet :

- consulter une publication ;
- consulter l'historique ;
- suivre l'état d'une publication.

---

## PublishingRepository

Responsable de la persistance des publications.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Create Publication
- Update Publication
- Validate Publication
- Publish Event
- Archive Publication
- Restore Publication
- Get Publication
- List Publications

---

# Validation

Avant publication, le domaine vérifie notamment :

- présence des informations obligatoires ;
- cohérence des dates ;
- cohérence des horaires ;
- validité des références ;
- intégrité des données.

Les règles de validation restent déterministes.

---

# Flux principaux

## Nouvelle publication

```text
Organizer

↓

Publishing

↓

Validation

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

## Archivage

```text
Organizer

↓

Publishing

↓

Catalog

↓

EventArchived
```

---

# Événements du domaine

Le domaine publie notamment :

```text
PublicationCreated

PublicationValidated

PublicationPublished

PublicationUpdated

PublicationArchived
```

Ces événements permettent la synchronisation avec le Catalog.

---

# Dépendances techniques

Le domaine dépend des contrats publics suivants.

```text
Catalog API

ReferenceData API

Storage

Messaging
```

Publishing ne dépend jamais :

- du Planning ;
- de Discovery ;
- du Recommendation Engine.

---

# Gestion des données

Publishing est propriétaire :

- des brouillons ;
- des états de publication ;
- des validations ;
- de l'historique des publications.

Les événements publiés deviennent ensuite la responsabilité du Catalog.

---

# Sécurité

Toutes les opérations sont réalisées dans le contexte d'un organisateur authentifié.

Les permissions sont contrôlées avant l'exécution des cas d'utilisation.

Publishing reste indépendant du mécanisme RBAC.

---

# Performance

Le domaine privilégie :

- la fiabilité des écritures ;
- la cohérence transactionnelle ;
- la traçabilité des modifications.

Le débit est moins critique que l'intégrité des données.

---

# Observabilité

Le domaine expose notamment :

- publications créées ;
- publications publiées ;
- validations refusées ;
- publications archivées ;
- durée moyenne de validation ;
- erreurs de publication.

Toutes les transitions d'état sont journalisées.

---

# Contraintes

Publishing respecte les principes suivants.

- une publication possède un cycle de vie contrôlé ;
- un événement n'est publié qu'après validation ;
- le Catalog reste propriétaire des événements publiés ;
- aucune logique de recommandation ;
- aucune logique de planning ;
- aucune logique de recherche.

Publishing est exclusivement responsable du workflow éditorial.

---

# Évolutions

La V3 pourra intégrer :

- validation collaborative ;
- assistance à la publication ;
- contrôle qualité automatisé ;
- suggestions d'amélioration ;
- publication différée.

Ces évolutions ne modifieront pas la responsabilité fondamentale du domaine.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

02-FSPEC.13-Publishing-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Publishing. |