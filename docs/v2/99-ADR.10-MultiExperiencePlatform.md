# ADR.10 – Multi-Experience Platform

**Document** : ADR.10

**Fichier** : 99-ADR.10-MultiExperiencePlatform.md

**Version** : 2.0

**Statut** : Accepted

---

# Contexte

EventFoundry répond à des besoins très différents :

- découvrir des événements ;
- organiser des publications ;
- administrer la plateforme.

Créer plusieurs applications entraînerait une duplication importante des développements.

---

# Décision

EventFoundry reste une plateforme unique proposant plusieurs expériences utilisateur.

Les expériences sont adaptées au contexte de travail sans modifier le cœur fonctionnel.

---

# Les expériences

La plateforme définit les expériences suivantes :

- Explorer
- Organizer
- Operator

Chaque expérience possède :

- une navigation dédiée ;
- un tableau de bord ;
- un vocabulaire adapté ;
- des écrans spécialisés.

---

# Les éléments communs

Toutes les expériences partagent :

- l'authentification ;
- le catalogue ;
- les services métier ;
- les APIs ;
- les référentiels ;
- les modèles de données.

---

# Sélection de l'expérience

L'authentification est indépendante de l'expérience utilisateur.

Après connexion, l'utilisateur accède à l'expérience utilisée lors de sa dernière session.

S'il possède plusieurs rôles, il peut changer d'expérience à tout moment.

Le changement d'expérience :

- ne nécessite pas une nouvelle authentification ;
- ne modifie pas les permissions ;
- conserve le contexte de navigation lorsque cela est possible ;
- recharge uniquement l'interface adaptée.

Cette action est accessible depuis le menu utilisateur.

---

# Changement d'expérience

Le changement d'expérience ne crée pas une nouvelle session.

Il ne modifie pas les permissions.

Il adapte uniquement l'interface utilisateur.

---

# Pourquoi cette architecture

Cette approche permet :

- une plateforme unique ;
- un développement plus rapide ;
- une maintenance simplifiée ;
- une expérience adaptée à chaque profil.

---

# Alternatives étudiées

## Plusieurs applications

Rejeté.

Duplication importante.

Maintenance plus coûteuse.

---

## Interface unique

Rejeté.

Navigation trop complexe.

Fonctionnalités difficilement découvrables.

---

# Conséquences

Le frontend devient piloté par l'expérience sélectionnée.

Les services métier restent mutualisés.

Les nouvelles expériences pourront être ajoutées sans remettre en cause l'architecture existante.

---

# Documents liés

11-V2.02-Personas-v2.0

11-V2.03-UserExperiences-v2.0

ADR.08-RoleBasedAccessControl

ADR.11-IdentityRolesExperiencesSubscriptions

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Adoption d'une plateforme multi-expériences. |