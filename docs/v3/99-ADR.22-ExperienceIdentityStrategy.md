# ADR.22 – Experience Identity Strategy

**Document** : ADR.22

**Fichier** : 99-ADR.22-ExperienceIdentityStrategy.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

EventFoundry ne propose pas une interface unique.

La plateforme regroupe plusieurs expériences répondant à des usages différents.

La V3 distingue notamment :

- Explorer ;
- Organizer ;
- Operator.

Ces expériences partagent la même plateforme mais poursuivent des objectifs distincts.

L'utilisateur doit pouvoir identifier immédiatement le contexte dans lequel il évolue.

---

# Problème

Sans stratégie commune, chaque module pourrait adopter sa propre identité graphique.

Cette approche entraînerait :

- une navigation incohérente ;
- une rupture de l'expérience utilisateur ;
- une duplication des composants ;
- une maintenance complexe.

La plateforme doit définir une identité visuelle cohérente pour chaque expérience tout en conservant une architecture commune.

---

# Décision

Chaque expérience dispose d'une identité propre.

Cette identité est définie par un ensemble cohérent d'éléments visuels.

Les composants fonctionnels restent communs.

Seuls les éléments d'identité varient selon l'expérience active.

---

# Objectifs

Cette stratégie poursuit plusieurs objectifs.

## Identifier immédiatement le contexte

L'utilisateur doit reconnaître instantanément l'expérience dans laquelle il se trouve.

---

## Mutualiser les composants

Les composants fonctionnels sont partagés entre toutes les expériences.

Ils adaptent automatiquement leur identité visuelle.

---

## Limiter la duplication

La logique métier reste indépendante des choix graphiques.

Une même fonctionnalité peut être utilisée dans plusieurs expériences.

---

## Faciliter les évolutions

Une nouvelle expérience peut être introduite sans refondre les composants existants.

---

# Les expériences

## Explorer

Destinée aux utilisateurs recherchant des activités.

L'interface privilégie :

- la découverte ;
- la recherche ;
- les recommandations ;
- le planning personnel.

---

## Organizer

Destinée aux organisations publiant des événements.

L'interface privilégie :

- la gestion ;
- les imports ;
- les statistiques ;
- l'administration des contenus.

---

## Operator

Destinée aux administrateurs de la plateforme.

L'interface privilégie :

- la supervision ;
- la configuration ;
- l'observabilité ;
- le support.

---

# Identité

Chaque expérience définit notamment :

- palette de couleurs ;
- icônes ;
- illustrations ;
- navigation ;
- vocabulaire ;
- composants spécifiques.

Ces éléments sont documentés dans les UISPEC.

---

# Composants

Les composants sont indépendants de leur identité visuelle.

Ils utilisent uniquement des tokens de design.

Ils ne définissent jamais directement leurs propres couleurs.

Cette approche garantit leur réutilisabilité.

---

# Thèmes

Les expériences peuvent coexister avec les thèmes utilisateur.

Par exemple :

- clair ;
- sombre ;
- contraste élevé.

Le thème constitue une préférence utilisateur.

L'identité de l'expérience reste inchangée.

---

# Navigation

Chaque expérience peut proposer :

- une navigation différente ;
- des tableaux de bord différents ;
- des menus adaptés.

Ces différences n'affectent jamais le domaine métier.

---

# Architecture

L'identité d'une expérience est déterminée au niveau de la couche de présentation.

Le domaine métier ignore totalement :

- les couleurs ;
- les thèmes ;
- les composants graphiques.

Cette séparation respecte les principes d'architecture de la plateforme.

---

# Évolutivité

La stratégie doit permettre d'ajouter de nouvelles expériences.

Par exemple :

- Volunteer ;
- Moderator ;
- Partner.

Ces évolutions ne nécessitent aucune modification des composants métier.

---

# Conséquences

Cette décision implique que :

- chaque expérience possède une identité cohérente ;
- les composants restent mutualisés ;
- les choix graphiques sont centralisés ;
- le domaine métier reste totalement indépendant de la présentation.

La plateforme bénéficie d'une expérience utilisateur homogène tout en conservant une architecture modulaire.

---

# Alternatives étudiées

## Interface unique

Une seule identité graphique est utilisée pour tous les utilisateurs.

Cette approche simplifie le design mais ne permet pas d'adapter efficacement l'interface aux différents profils.

Cette solution est rejetée.

---

## Identités par expérience

Chaque expérience possède sa propre identité tout en partageant les mêmes composants et les mêmes règles métier.

Cette approche améliore la lisibilité, la cohérence et l'évolutivité de la plateforme.

Cette solution est retenue.

---

# Documents impactés

04-UISPEC.*

01-ARCHI.*

02-FSPEC.*

03-TSPEC.Frontend.*

99-ADR.*

---

# Documents liés

ADR.12 – Platform Architecture Principles

ADR.18 – Organization Domain Model

ADR.20 – User Preferences Model

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Définition d'une stratégie d'identité propre à chaque expérience utilisateur de la plateforme. |