# ADR.20 – Secrets Management

**Document** : ADR.20

**Fichier** : 99-ADR.20-SecretsManagement.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

EventFoundry s'appuie sur de nombreux services externes.

Ces services nécessitent l'utilisation de secrets techniques tels que :

- clés API ;
- identifiants OAuth ;
- mots de passe SMTP ;
- jetons d'accès ;
- certificats ;
- clés privées.

Ces informations sont sensibles.

Elles ne doivent jamais être exposées au domaine métier, au code source ou aux interfaces utilisateur.

La plateforme doit disposer d'une stratégie unifiée de gestion des secrets.

---

# Problème

Les secrets sont utilisés par plusieurs composants de la plateforme.

Par exemple :

- connecteurs d'import ;
- fournisseurs d'intelligence artificielle ;
- services SMTP ;
- services de cartographie ;
- fournisseurs OAuth ;
- API tierces.

Les stocker directement dans les objets métier ou dans les fichiers de configuration créerait plusieurs risques :

- divulgation accidentelle ;
- duplication ;
- difficultés de rotation ;
- absence de traçabilité ;
- dépendance à une infrastructure particulière.

Une architecture dédiée est nécessaire.

---

# Décision

Tous les secrets sont gérés par un composant spécialisé de gestion des secrets.

Le domaine métier ne manipule jamais directement les valeurs secrètes.

Il utilise uniquement des références logiques permettant d'accéder aux secrets lorsque cela est nécessaire.

---

# Objectifs

La stratégie poursuit plusieurs objectifs.

## Sécurité

Les secrets ne sont jamais exposés inutilement.

Ils sont protégés pendant tout leur cycle de vie.

---

## Découplage

Le domaine métier ne dépend d'aucun mécanisme particulier de stockage des secrets.

---

## Rotation

Les secrets peuvent être renouvelés sans modification du code applicatif.

---

## Portabilité

La plateforme peut fonctionner avec différents gestionnaires de secrets.

---

# Types de secrets

La plateforme peut gérer notamment :

- API Keys ;
- Client Secret OAuth ;
- Tokens d'accès ;
- Certificats TLS ;
- Clés privées ;
- Comptes SMTP ;
- Identifiants de bases de données ;
- Secrets de connecteurs ;
- Clés des fournisseurs IA.

Cette liste est extensible.

---

# Architecture

Le domaine métier ne connaît jamais la valeur d'un secret.

Il manipule uniquement une référence.

```
Domain

↓

Secret Reference

↓

Secrets Provider

↓

Infrastructure

↓

Secret Value
```

La résolution du secret intervient uniquement au moment de son utilisation.

---

# Responsabilités

## Domaine métier

Le domaine connaît uniquement l'existence d'un secret.

Il ne connaît jamais son contenu.

---

## Secrets Provider

Le fournisseur est responsable :

- de récupérer le secret ;
- de contrôler les accès ;
- de journaliser les opérations ;
- de masquer les valeurs sensibles.

---

## Infrastructure

L'infrastructure stocke les secrets de manière sécurisée.

Elle peut utiliser différents mécanismes selon l'environnement.

---

# Fournisseurs compatibles

L'architecture doit permettre l'utilisation de plusieurs solutions.

Par exemple :

- Kubernetes Secrets ;
- HashiCorp Vault ;
- AWS Secrets Manager ;
- Azure Key Vault ;
- Google Secret Manager ;
- variables d'environnement sécurisées.

Le choix du fournisseur reste une décision d'infrastructure.

---

# Rotation

Les secrets doivent pouvoir être renouvelés.

La rotation ne doit nécessiter :

- aucune recompilation ;
- aucune modification du domaine métier ;
- aucune migration fonctionnelle.

---

# Journalisation

Les accès aux secrets sont journalisés.

Les journaux ne contiennent jamais les valeurs des secrets.

Ils enregistrent uniquement :

- la date ;
- le composant consommateur ;
- le type de secret ;
- le résultat de l'opération.

---

# Sécurité

Les secrets ne doivent jamais :

- apparaître dans les logs ;
- être exposés dans les API ;
- être affichés dans les interfaces ;
- être stockés dans les objets métier ;
- être versionnés dans le dépôt Git.

Les interfaces administratives affichent uniquement des métadonnées permettant d'identifier un secret.

---

# Multi-organisation

Les secrets peuvent être associés :

- à la plateforme ;
- à une organisation ;
- exceptionnellement à un utilisateur lorsque cela est justifié.

Le niveau de portée est défini par le contexte d'utilisation.

Cette approche permet à plusieurs organisations de gérer leurs propres fournisseurs externes sans partager leurs informations sensibles.

---

# Observabilité

Le système produit des métriques sur :

- les accès ;
- les erreurs ;
- les rotations ;
- les expirations ;
- les tentatives non autorisées.

Ces informations alimentent les outils d'observabilité de la plateforme.

---

# Conséquences

Cette décision implique que :

- le domaine métier reste totalement indépendant des mécanismes de stockage des secrets ;
- la rotation des secrets devient transparente pour les applications ;
- les différents environnements peuvent utiliser des solutions adaptées à leurs contraintes ;
- la sécurité est renforcée par une gestion centralisée.

Le composant Secrets Management devient le point d'entrée unique pour l'accès aux informations sensibles.

---

# Alternatives étudiées

## Secrets dans les fichiers de configuration

Les secrets sont stockés dans les fichiers applicatifs ou les variables directement consommées par les modules.

Cette approche est simple mais augmente le risque de divulgation et rend la rotation complexe.

Cette solution est rejetée.

---

## Gestionnaire de secrets dédié

Les secrets sont externalisés dans un composant spécialisé.

Les applications ne manipulent que des références.

Cette approche améliore la sécurité, la portabilité et la maintenabilité.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Organization.*

02-FSPEC.Integration.*

03-TSPEC.Security.*

03-TSPEC.Infrastructure.*

03-TSPEC.Connectors.*

99-ADR.*

---

# Documents liés

ADR.11 – Platform Architecture Principles

ADR.12 – Import Connector Framework

ADR.15 – AI Boundaries

ADR.17 – Organization Domain Model

ADR.22 – Observability Strategy

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction d'une stratégie unifiée de gestion des secrets techniques de la plateforme. |