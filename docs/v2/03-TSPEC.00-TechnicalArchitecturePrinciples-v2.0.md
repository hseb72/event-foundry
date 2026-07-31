# Principes d'Architecture Technique

**Document** : TSPEC.00

**Fichier** : 03-TSPEC.00-TechnicalArchitecturePrinciples-v2.0.md

**Version** : 2.0

**Statut** : Référence

---

# Objectif

Ce document définit les principes d'architecture technique d'EventFoundry V2.

Il constitue la référence commune à l'ensemble des spécifications techniques (TSPEC).

Les décisions décrites dans ce document s'appliquent à tous les composants de la plateforme, sauf mention contraire formalisée par un ADR.

---

# Objectifs de l'architecture

L'architecture technique poursuit les objectifs suivants :

- simplicité ;
- modularité ;
- évolutivité ;
- testabilité ;
- observabilité ;
- sécurité ;
- maintenabilité.

Les choix techniques doivent toujours privilégier la simplicité lorsqu'aucun bénéfice fonctionnel ne justifie une architecture plus complexe.

---

# Principes fondamentaux

## Domain First

La structure technique découle des domaines métier définis dans les spécifications fonctionnelles.

L'architecture ne doit pas imposer l'organisation fonctionnelle.

---

## Responsabilité unique

Chaque module possède une responsabilité clairement identifiée.

Les dépendances entre modules doivent rester limitées.

---

## Faible couplage

Les modules communiquent uniquement via leurs contrats publics.

Les détails d'implémentation restent internes.

---

## Forte cohésion

Les fonctionnalités traitant du même domaine métier sont regroupées dans un même module.

---

## Évolution incrémentale

L'architecture doit permettre l'ajout de nouvelles fonctionnalités sans remise en cause des composants existants.

---

# Découpage technique

La plateforme est organisée autour des principaux domaines fonctionnels.

- Identity
- Catalog
- Publishing
- Discovery
- Recommendation Engine
- Planning
- Notifications
- Reference Data
- Search

Chaque domaine fait l'objet d'une spécification technique dédiée.

---

# Dépendances

Les dépendances doivent rester orientées.

Un module ne peut dépendre que :

- des composants techniques communs ;
- des contrats publics d'un autre domaine.

Les dépendances circulaires sont interdites.

---

# Contrats

Chaque domaine expose uniquement les interfaces nécessaires.

Les implémentations restent privées.

Les contrats constituent la seule surface de communication entre domaines.

---

# Modèle de données

Chaque domaine est propriétaire de ses données.

Les accès directs aux structures internes d'un autre domaine sont interdits.

Les échanges passent par les contrats publics.

---

# API

Les API doivent être :

- cohérentes ;
- versionnées lorsque nécessaire ;
- documentées ;
- indépendantes des interfaces utilisateur.

Les API représentent un contrat technique.

Elles ne doivent jamais exposer directement les structures internes.

---

# Événements techniques

Les événements permettent de notifier les autres domaines d'un changement significatif.

Ils ne remplacent pas les appels synchrones lorsque ceux-ci sont plus adaptés.

Les événements transportent uniquement les informations nécessaires.

---

# Gestion des erreurs

Les erreurs doivent être :

- explicites ;
- journalisées ;
- traçables.

Les erreurs techniques ne doivent jamais être exposées directement aux utilisateurs.

---

# Journalisation

Chaque domaine produit des journaux permettant :

- le diagnostic ;
- l'audit ;
- le suivi des traitements.

Les informations sensibles ne doivent jamais être enregistrées.

---

# Observabilité

La plateforme doit permettre :

- le suivi des performances ;
- la supervision des traitements ;
- la détection des anomalies.

Chaque composant expose des métriques adaptées à sa responsabilité.

---

# Sécurité

La sécurité repose notamment sur :

- l'authentification ;
- l'autorisation ;
- la protection des données ;
- la traçabilité des actions.

Les permissions sont contrôlées au niveau des services applicatifs.

---

# Performance

Les traitements doivent privilégier :

- la simplicité ;
- la lisibilité ;
- la robustesse.

Les optimisations ne sont introduites qu'après identification d'un besoin réel.

---

# Configuration

Les paramètres techniques sont externalisés.

Aucun comportement métier ne doit dépendre d'une constante codée dans l'application.

---

# Tests

Chaque domaine doit être couvert par :

- des tests unitaires ;
- des tests d'intégration ;
- des tests fonctionnels lorsque nécessaire.

Les tests constituent une partie intégrante de l'architecture.

---

# Documentation

Chaque composant technique doit disposer d'une documentation à jour.

Toute évolution significative doit être accompagnée d'une mise à jour de la documentation concernée.

---

# Évolutions

Toute décision remettant en cause les principes définis dans ce document doit faire l'objet d'un nouvel ADR.

---

# Documents liés

00-Glossaire-v2.0

01-ARCHI.00-ArchitectureOverview-v2.0

10-STRAT.01-ProductVision-v2.0

99-ADR.08-RoleBasedAccessControl-v2.0

99-ADR.09-DeterministicRecommendationEngine-v2.0

99-ADR.10-MultiExperiencePlatform-v2.0

99-ADR.11-IdentityRolesExperiencesSubscriptions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première définition des principes d'architecture technique de la V2. |