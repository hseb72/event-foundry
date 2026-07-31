# ADR.18 – Organization Domain Model

**Document** : ADR.18

**Fichier** : 99-ADR.18-OrganizationDomainModel.md

**Version** : 3.0

**Statut** : Accepted

---

# Contexte

EventFoundry met en relation plusieurs catégories d'acteurs.

Parmi eux, les organisations occupent une place centrale.

Une organisation peut notamment :

- publier des événements ;
- importer des données ;
- gérer plusieurs membres ;
- administrer ses connecteurs ;
- personnaliser ses paramètres ;
- recevoir des notifications ;
- gérer sa visibilité.

La V2 associait ces informations principalement aux utilisateurs.

La V3 introduit une séparation explicite entre les personnes et les organisations.

---

# Problème

Une même personne peut intervenir pour plusieurs structures.

Par exemple :

- une mairie ;
- une association ;
- un club ;
- une boutique ;
- une salle de jeux ;
- un office de tourisme.

À l'inverse, une même organisation peut compter plusieurs administrateurs et contributeurs.

Associer directement les ressources à un utilisateur empêcherait de représenter correctement ces situations.

La plateforme doit donc distinguer clairement :

- les personnes ;
- les organisations ;
- les relations entre les deux.

---

# Décision

L'**Organization** devient une entité métier de premier niveau.

Elle constitue le périmètre naturel d'administration de nombreuses fonctionnalités.

Les utilisateurs agissent toujours au nom d'une organisation lorsqu'ils réalisent des opérations relevant de celle-ci.

---

# Objectifs

Le modèle Organization poursuit plusieurs objectifs.

## Séparer les responsabilités

Les utilisateurs représentent des personnes.

Les organisations représentent des structures.

Cette distinction reflète le fonctionnement réel des acteurs de l'écosystème.

---

## Mutualiser les ressources

Les ressources communes appartiennent à l'organisation.

Par exemple :

- connecteurs ;
- paramètres ;
- médias ;
- API Keys ;
- abonnements ;
- statistiques.

Elles ne dépendent pas d'un utilisateur particulier.

---

## Faciliter la collaboration

Plusieurs utilisateurs peuvent administrer une même organisation.

Les droits sont attribués indépendamment de l'identité des personnes.

---

## Préparer les évolutions futures

Le modèle permet d'introduire ultérieurement :

- plusieurs équipes ;
- plusieurs établissements ;
- plusieurs marques ;
- plusieurs espaces de travail.

Sans remettre en cause les fondements du domaine.

---

# Responsabilités

Une organisation peut être responsable de :

- publier des événements ;
- administrer des connecteurs ;
- gérer ses membres ;
- définir ses préférences ;
- gérer son identité visuelle ;
- configurer ses notifications ;
- consulter ses statistiques.

---

# Relation avec les utilisateurs

Un utilisateur peut appartenir à plusieurs organisations.

Une organisation peut accueillir plusieurs utilisateurs.

La relation est donc de type **Many-to-Many**.

Cette relation est enrichie par un rôle.

Par exemple :

- Owner ;
- Administrator ;
- Editor ;
- Contributor ;
- Viewer.

Le rôle détermine les capacités de chaque membre au sein de l'organisation.

---

# Ressources rattachées

Les éléments suivants appartiennent à une organisation :

- Connecteurs
- Événements
- Médias
- Secrets
- Paramètres
- Notifications
- Membres
- Statistiques
- API Keys

Les données personnelles des utilisateurs restent indépendantes.

---

# Gouvernance

Chaque organisation possède :

- une identité ;
- un statut ;
- une politique de visibilité ;
- des paramètres fonctionnels ;
- des paramètres techniques.

Ces éléments définissent son comportement dans la plateforme.

---

# Isolation

Les données d'une organisation sont isolées des autres organisations.

Les utilisateurs n'accèdent qu'aux organisations pour lesquelles ils disposent d'un rôle.

Cette isolation constitue la base du modèle multi-tenant logique de la plateforme.

---

# Cycle de vie

Une organisation peut être :

- créée ;
- activée ;
- suspendue ;
- archivée ;
- supprimée.

Chaque changement d'état est historisé.

---

# Conséquences

Cette décision implique que :

- les utilisateurs ne possèdent plus directement les ressources métier de leur organisation ;
- les ressources sont mutualisées au niveau de l'organisation ;
- les rôles deviennent contextuels à une organisation ;
- la collaboration entre plusieurs membres est prise en charge nativement.

Le modèle Organization devient un pilier fonctionnel de la plateforme.

---

# Alternatives étudiées

## Ressources rattachées aux utilisateurs

Chaque utilisateur possède directement ses connecteurs, événements et paramètres.

Cette approche simplifie les premiers développements mais ne permet pas de représenter les organisations réelles ni le travail collaboratif.

Cette solution est rejetée.

---

## Entité Organization dédiée

Les ressources sont rattachées à une organisation indépendante des utilisateurs.

Les utilisateurs agissent selon le rôle qui leur est attribué.

Cette approche favorise la collaboration, l'évolutivité et la séparation des responsabilités.

Cette solution est retenue.

---

# Documents impactés

01-ARCHI.*

02-FSPEC.Organization.*

02-FSPEC.User.*

03-TSPEC.Organization.*

03-TSPEC.Security.*

04-UISPEC.Organization.*

99-ADR.*

---

# Documents liés

ADR.12 – Platform Architecture Principles

ADR.17 – Notification Framework

ADR.19 – Follow Model

ADR.20 – User Preferences

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Introduction du modèle métier Organization comme entité centrale de gouvernance et de collaboration. |