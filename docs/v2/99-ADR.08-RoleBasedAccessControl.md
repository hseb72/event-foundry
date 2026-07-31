# ADR.08 – Role-Based Access Control (RBAC)

**Document** : ADR.08

**Fichier** : 99-ADR.08-RoleBasedAccessControl.md

**Version** : 2.0

**Statut** : Accepted

---

# Contexte

EventFoundry s'adresse à plusieurs catégories d'utilisateurs :

- Explorers
- Organizers
- Platform Operators
- Customer Success
- Finance

Une même personne peut exercer plusieurs responsabilités.

Le système doit permettre cette flexibilité tout en garantissant un contrôle d'accès simple, sécurisé et évolutif.

---

# Décision

La plateforme adopte un modèle de contrôle d'accès de type RBAC (Role-Based Access Control).

Les permissions sont accordées à des rôles.

Les utilisateurs héritent des permissions des rôles qui leur sont attribués.

Les permissions sont évaluées dans le contexte de l'organisation active.

---

# Principes

Chaque permission représente une capacité métier atomique.

Exemples :

- event.read
- event.create
- event.publish
- import.execute
- validation.review
- billing.manage

Les rôles regroupent uniquement des permissions.

Ils ne contiennent aucune logique d'interface ni de tarification.

---

# Organisations

Un utilisateur peut appartenir à plusieurs organisations.

Chaque organisation possède ses propres rôles.

Les permissions sont calculées dans le contexte de l'organisation sélectionnée.

---

# Pourquoi RBAC

Le RBAC permet :

- une administration simple ;
- une bonne lisibilité ;
- une séparation claire des responsabilités ;
- une extension progressive des rôles.

---

# Alternatives étudiées

## ACL utilisateur

Rejeté.

La maintenance devient rapidement complexe.

---

## Permissions codées en dur

Rejeté.

Peu évolutif.

---

## ABAC

Rejeté pour la V2.

La richesse fonctionnelle ne justifie pas encore cette complexité.

Le modèle pourra évoluer ultérieurement.

---

# Conséquences

Le backend contrôle exclusivement les permissions.

Le frontend adapte uniquement l'affichage.

Les permissions restent indépendantes :

- des expériences utilisateur ;
- des abonnements.

---

# Documents liés

99-ADR.10-MultiExperiencePlatform

99-ADR.11-IdentityRolesExperiencesSubscriptions

02-FSPEC.10-ProfilesAndPermissions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Adoption du modèle RBAC. |