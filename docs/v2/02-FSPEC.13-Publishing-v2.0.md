# Publishing

**Document** : V2.07

**Fichier** : 12-V2.07-Publishing-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les fonctionnalités de publication de l'expérience Organizer.

La publication permet aux organisateurs de créer, enrichir et diffuser leurs événements de manière simple et fiable.

---

# Philosophie

L'expérience Organizer est conçue pour réduire au maximum le temps nécessaire à la publication d'un événement.

L'organisateur doit consacrer son temps à son activité culturelle, et non à la saisie d'informations.

La plateforme automatise autant que possible les traitements répétitifs.

---

# Les objectifs

L'expérience Organizer permet notamment de :

- publier rapidement un événement ;
- importer plusieurs événements ;
- suivre leur état de publication ;
- corriger les informations détectées automatiquement ;
- analyser les performances de diffusion.

---

# Les modes de publication

La plateforme propose plusieurs modes de création.

## Création manuelle

L'organisateur complète un formulaire structuré.

Cette méthode est adaptée aux événements unitaires.

---

## Import documentaire

L'organisateur transmet un document.

Le pipeline documentaire extrait automatiquement les informations disponibles.

L'utilisateur vérifie ensuite les données détectées avant publication.

Le fonctionnement détaillé de ce pipeline reste défini par les spécifications de la V1.

---

## Réutilisation

Un événement existant peut être utilisé comme modèle afin de créer rapidement une nouvelle édition.

---

# Le cycle de publication

Chaque événement suit un cycle de vie.

Exemple :

- Brouillon
- En validation
- Publié
- Modifié
- Archivé

Les transitions sont contrôlées par les règles métier de la plateforme.

---

# Le tableau de bord

Le tableau de bord Organizer présente notamment :

- les brouillons ;
- les publications récentes ;
- les événements à venir ;
- les imports en cours ;
- les éventuelles erreurs.

Il constitue le point d'entrée de l'expérience Organizer.

---

# Les statistiques

L'organisateur peut consulter des indicateurs relatifs à ses publications.

Exemples :

- nombre d'événements publiés ;
- consultations ;
- ajouts au planning ;
- réservations (selon les intégrations disponibles) ;
- évolution de l'audience.

Le niveau de détail dépend des fonctionnalités disponibles pour son abonnement.

---

# Les interactions

La publication alimente directement le catalogue.

Le catalogue devient ensuite disponible pour :

- la découverte ;
- les recommandations ;
- le planning ;
- les notifications.

---

# Les principes

## Simplicité

Chaque publication doit nécessiter un minimum d'interactions.

---

## Fiabilité

Les informations publiées doivent être cohérentes et vérifiables.

---

## Assistance

Les traitements automatiques assistent l'organisateur sans se substituer à lui.

---

## Transparence

L'organisateur comprend toujours l'état de son événement et les actions attendues.

---

# Notre différence

La publication ne se limite pas à créer un événement.

Elle constitue le point d'entrée d'un pipeline complet de qualification des données.

Chaque événement publié devient une ressource exploitable par l'ensemble de la plateforme.

---

# Documents liés

12-V2.01-FunctionalSpecifications-v2.0

11-V2.03-UserExperiences-v2.0

03-TechnicalSpecifications-v1.0

ADR.10-MultiExperiencePlatform

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification des fonctionnalités de publication de l'expérience Organizer. |