# Search

**Document** : TSPEC.09

**Fichier** : 03-TSPEC.09-Search-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir l'architecture technique du domaine **Search**.

Search est responsable de l'indexation, de la recherche et de l'optimisation de l'accès aux données du Catalog.

Il fournit des capacités techniques de recherche performantes aux domaines consommateurs, sans porter de logique métier.

---

# Responsabilités

Le domaine Search est responsable de :

- indexer les événements publiés ;
- exécuter les recherches ;
- appliquer les critères techniques de filtrage ;
- gérer les facettes de recherche ;
- assurer le tri des résultats ;
- optimiser les performances des requêtes.

Search n'est pas responsable :

- des événements ;
- des recommandations ;
- du planning ;
- des publications ;
- des décisions métier.

---

# Position dans l'architecture

```text
               Discovery
                    │
                    ▼
                 Search
                    │
                    ▼
                 Catalog
```

Search fournit un service technique partagé.

Le Catalog reste propriétaire des données.

---

# Structure du module

```text
Search

├── Domain
│   ├── Index
│   ├── Queries
│   ├── Facets
│   ├── Sorting
│   └── DomainEvents
│
├── Application
│   ├── Queries
│   ├── Indexing
│   ├── DTO
│   └── UseCases
│
├── Infrastructure
│   ├── SearchEngine
│   ├── IndexStorage
│   ├── Messaging
│   └── Catalog
│
└── API
```

---

# Modèle technique

Le domaine manipule principalement un index de recherche.

```text
SearchIndex

├── IndexedEvent
├── Facets
├── Keywords
├── Metadata
└── RankingInformation
```

L'index est une projection technique du Catalog.

Il ne constitue jamais la source de vérité.

---

# Interfaces publiques (Ports)

## SearchQueryService

Permet notamment :

- rechercher des événements ;
- appliquer des filtres ;
- obtenir des facettes ;
- trier les résultats ;
- paginer les résultats.

---

## SearchIndexService

Permet notamment :

- indexer un événement ;
- mettre à jour un index ;
- supprimer un document ;
- reconstruire un index.

---

## SearchRepository

Responsable de la persistance de l'index.

---

# Cas d'utilisation

Le domaine implémente notamment :

- Search Events
- Index Event
- Update Index
- Remove From Index
- Rebuild Index
- Get Facets
- Sort Results

---

# Flux principaux

## Indexation

```text
EventPublished

↓

Search

↓

Index Updated
```

---

## Mise à jour

```text
EventUpdated

↓

Search

↓

Index Updated
```

---

## Archivage

```text
EventArchived

↓

Search

↓

Index Cleaned
```

---

## Recherche

```text
Discovery

↓

Search

↓

Catalog Index

↓

Search Results
```

---

# Indexation

Chaque événement publié dans le Catalog est indexé.

L'index contient uniquement les informations nécessaires à la recherche.

Il peut être reconstruit intégralement à partir du Catalog.

---

# Recherche

Search prend en charge notamment :

- texte libre ;
- filtres multicritères ;
- facettes ;
- pagination ;
- tri.

Les règles de pertinence métier restent définies par les domaines consommateurs.

---

# Événements du domaine

Le domaine publie notamment :

```text
IndexCreated

IndexUpdated

IndexDeleted

IndexRebuilt
```

---

# Dépendances techniques

Le domaine dépend des contrats publics suivants.

```text
Catalog API

Messaging

Search Engine
```

Search ne dépend d'aucun autre domaine métier.

---

# Gestion des données

Search est propriétaire :

- des index ;
- des projections de recherche ;
- des statistiques techniques.

Le Catalog reste propriétaire des événements.

L'index peut être supprimé puis reconstruit sans perte fonctionnelle.

---

# Sécurité

Les contrôles d'autorisation restent assurés par les domaines consommateurs.

Search ne prend aucune décision d'accès.

Les données indexées respectent les politiques de confidentialité définies par le Catalog.

---

# Performance

Le domaine est optimisé pour :

- les recherches à faible latence ;
- l'indexation asynchrone ;
- les lectures massives ;
- la montée en charge horizontale.

Les performances de recherche ne doivent pas impacter les opérations d'écriture du Catalog.

---

# Observabilité

Le domaine expose notamment :

- taille des index ;
- nombre de documents indexés ;
- durée moyenne des recherches ;
- durée moyenne d'indexation ;
- taux d'erreur d'indexation ;
- temps de reconstruction.

Les opérations d'indexation sont historisées.

---

# Contraintes

Search respecte les principes suivants.

- l'index est une projection technique ;
- le Catalog reste la source de vérité ;
- aucune logique métier n'est implémentée ;
- les index sont reconstruisibles ;
- la recherche est découplée du stockage.

Toute évolution de ces principes nécessite un ADR.

---

# Évolutions

La V3 pourra intégrer :

- recherche sémantique ;
- synonymes ;
- correction orthographique ;
- autocomplétion ;
- index géographiques avancés ;
- recherche vectorielle.

Ces évolutions ne modifieront pas la responsabilité fondamentale du domaine.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0

03-TSPEC.01-Catalog-v2.0

03-TSPEC.04-Discovery-v2.0

03-TSPEC.08-ReferenceData-v2.0

02-FSPEC.12-Discovery-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification technique du domaine Search. |