# Shared Components

**Document** : UISPEC.04

**Fichier** : 04-UISPEC.04-SharedComponents-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les composants d'interface réutilisables de la plateforme EventFoundry.

Les composants décrits dans ce document constituent le Design System fonctionnel utilisé par les expériences Explorer, Organizer et Operator.

Ils garantissent une interface cohérente, homogène et réutilisable.

---

# Principes

Chaque composant possède :

- une responsabilité unique ;
- un comportement prévisible ;
- des variantes clairement définies ;
- une accessibilité intégrée ;
- une documentation unique.

Les composants sont indépendants des technologies d'implémentation.

---

# Classification

Les composants sont regroupés en six familles.

| Famille | Description |
|----------|-------------|
| Navigation | Déplacement dans l'application |
| Présentation | Affichage des données |
| Saisie | Interaction utilisateur |
| Feedback | Retour système |
| Mise en page | Organisation des écrans |
| Métier | Composants spécifiques à EventFoundry |

---

# Navigation

## CMP-001 — Navigation Bar

### Objectif

Permettre la navigation principale.

### Utilisé par

- Explorer
- Organizer
- Operator

### Contenu

- logo
- menu principal
- changement d'expérience
- profil
- notifications

---

## CMP-002 — Breadcrumb

### Objectif

Afficher le contexte de navigation.

---

## CMP-003 — Pagination

### Objectif

Naviguer dans les listes volumineuses.

---

# Présentation

## CMP-101 — Event Card

### Objectif

Présenter un événement de manière synthétique.

### Informations

- image
- titre
- date
- lieu
- catégorie
- résumé

### Actions

- consulter
- ajouter au Planning

### Variantes

- compacte
- standard
- détaillée

---

## CMP-102 — Recommendation Card

### Objectif

Présenter une recommandation.

### Informations

- score
- raisons
- événement

### Actions

- accepter
- ignorer
- consulter

---

## CMP-103 — Planning Card

### Objectif

Afficher un événement du Planning.

### Informations

- état
- date
- conflit éventuel

### Actions

- confirmer
- annuler
- supprimer

---

## CMP-104 — Statistics Card

Présentation d'un indicateur.

---

## CMP-105 — Status Badge

Affichage d'un état.

Exemples :

- publié
- brouillon
- archivé
- confirmé

---

# Saisie

## CMP-201 — Search Bar

### Objectif

Recherche textuelle.

### Fonctionnalités

- saisie libre
- validation
- historique éventuel

---

## CMP-202 — Filters Panel

### Objectif

Sélectionner des critères.

### Exemples

- date
- activité
- commune
- catégorie

---

## CMP-203 — Date Picker

Sélection d'une date.

---

## CMP-204 — Calendar

Visualisation temporelle.

---

## CMP-205 — Map Selector

Sélection d'un lieu.

---

## CMP-206 — Rich Text Editor

Saisie des descriptions.

---

## CMP-207 — File Upload

Téléversement des médias.

---

# Feedback

## CMP-301 — Notification Toast

Information temporaire.

---

## CMP-302 — Confirmation Dialog

Confirmation des opérations sensibles.

---

## CMP-303 — Error Message

Présentation des erreurs.

Le message indique :

- le problème ;
- les conséquences ;
- la solution.

---

## CMP-304 — Progress Indicator

Affichage d'un traitement.

---

## CMP-305 — Empty State

Affichage lorsqu'aucune donnée n'est disponible.

Toujours accompagné d'une action.

---

# Mise en page

## CMP-401 — Page Header

Titre de page.

---

## CMP-402 — Section

Regroupement logique.

---

## CMP-403 — Panel

Bloc d'informations.

---

## CMP-404 — Sidebar

Navigation secondaire.

---

## CMP-405 — Toolbar

Actions principales.

---

# Composants métier

## CMP-501 — Recommendation Panel

Affichage des recommandations.

---

## CMP-502 — Planning Timeline

Vue chronologique.

---

## CMP-503 — Publication Status

Suivi du workflow de publication.

---

## CMP-504 — Validation Panel

Présentation des erreurs métier.

---

## CMP-505 — Reference Selector

Sélection d'une valeur de référentiel.

---

# États

Tous les composants supportent lorsque pertinent :

- chargement ;
- vide ;
- succès ;
- erreur ;
- désactivé.

---

# Accessibilité

Tous les composants respectent les principes suivants.

- navigation clavier ;
- contraste suffisant ;
- focus visible ;
- lecteurs d'écran ;
- libellés explicites.

Les composants interactifs restent utilisables sans souris.

---

# Responsive

Chaque composant possède au minimum trois comportements.

- Desktop
- Tablet
- Mobile

Les fonctionnalités restent identiques.

---

# Règles de composition

Les composants peuvent être composés.

Exemple :

```text
Page

↓

Header

↓

Toolbar

↓

Filters

↓

Event Cards

↓

Pagination
```

Les composants restent découplés.

---

# Cycle de vie

Un composant suit le cycle suivant.

```text
Création

↓

Validation UX

↓

Réutilisation

↓

Évolution

↓

Dépréciation
```

Les évolutions restent rétrocompatibles lorsque possible.

---

# Contraintes

Les composants respectent les principes suivants.

- une responsabilité unique ;
- aucune logique métier complexe ;
- réutilisables ;
- accessibles ;
- indépendants de leur implémentation technique.

---

# Documents liés

00-Glossaire-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification des composants partagés. |