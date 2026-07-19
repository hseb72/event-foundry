# Notifications

**Document** : V2.05

**Fichier** : 12-V2.05-Notifications-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le système de notifications d'EventFoundry.

Les notifications permettent d'informer l'utilisateur des événements importants concernant son activité et son planning.

Elles constituent un service d'assistance.

Elles ne constituent jamais un outil de réengagement artificiel.

---

# Principes

Chaque notification doit être :

- utile ;
- contextualisée ;
- configurable ;
- explicable.

Une notification n'est envoyée que lorsqu'elle apporte une valeur réelle à l'utilisateur.

---

# Les catégories

Le système distingue plusieurs catégories.

- Planning
- Réservations
- Recommandations
- Publications
- Système

Chaque catégorie peut être configurée indépendamment.

---

# Notifications de planning

Ces notifications concernent directement l'agenda personnel.

Exemples :

- rappel avant un événement ;
- modification d'un horaire ;
- annulation d'un événement ;
- conflit détecté.

Ces notifications sont prioritaires.

---

# Notifications de réservation

L'utilisateur est informé notamment :

- confirmation ;
- attente ;
- annulation ;
- remboursement ;
- ouverture de la billetterie.

---

# Notifications de recommandation

Le moteur peut proposer une notification lorsqu'une opportunité pertinente est détectée.

Exemples :

- un créneau libre est identifié ;
- un organisateur suivi publie un événement ;
- une activité correspond aux centres d'intérêt.

Ces notifications restent facultatives.

---

# Notifications Organizer

Les organisateurs reçoivent notamment :

- résultat d'un import ;
- publication réussie ;
- validation demandée ;
- rejet d'un événement ;
- statistiques disponibles.

---

# Notifications Operator

Les opérateurs sont informés :

- échec d'un traitement ;
- OCR en erreur ;
- validation en attente ;
- incident technique.

Ces notifications peuvent être critiques.

---

# Canaux

Selon les préférences utilisateur, une notification peut être transmise par :

- notification in-app ;
- courriel ;
- notification push.

De nouveaux canaux pourront être ajoutés ultérieurement.

---

# Préférences

Chaque utilisateur configure :

- les catégories souhaitées ;
- les canaux utilisés ;
- les horaires autorisés.

Certaines notifications critiques restent obligatoires.

---

# Les principes

## Priorité à l'utilisateur

Une notification répond à un besoin utilisateur.

Elle ne poursuit jamais un objectif marketing.

---

## Priorité au contexte

Une notification doit être envoyée au moment où elle est utile.

---

## Priorité à la maîtrise

L'utilisateur garde le contrôle de ses préférences.

---

# Notre différence

Les notifications d'EventFoundry cherchent à faciliter l'organisation de la vie culturelle.

Elles n'ont pas pour objectif d'augmenter artificiellement le temps passé dans l'application.

---

# Évolutions futures

Le système pourra intégrer :

- un mode silencieux intelligent ;
- un regroupement automatique des notifications ;
- une priorisation basée sur le contexte ;
- des notifications géolocalisées.

Ces évolutions devront respecter les principes définis dans ce document.

---

# Documents liés

12-V2.02-Planning-v2.0

12-V2.03-RecommendationEngine-v2.0

12-V2.04-ProfilesAndPermissions-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification du système de notifications. |