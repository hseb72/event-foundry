# Screen Catalogue

**Document** : UISPEC.07

**Fichier** : 04-UISPEC.07-ScreenCatalogue-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir le catalogue officiel des écrans de la plateforme EventFoundry.

Chaque écran possède un identifiant unique utilisé dans l'ensemble de la documentation fonctionnelle, technique et UX.

Le catalogue constitue la référence unique des interfaces utilisateur.

---

# Principes

Chaque écran :

- possède une responsabilité unique ;
- appartient à une seule expérience ;
- possède un identifiant permanent ;
- est référençable depuis les User Flows, les FSPEC, les TSPEC et les tests.

Les identifiants ne sont jamais réutilisés.

---

# Convention de nommage

Les identifiants suivent le format :

```text
<EXPÉRIENCE>-<NUMÉRO>
```

Exemples :

```text
EXP-001

ORG-003

OPE-006
```

Les numéros restent stables au fil des versions.

---

# Classification

Les écrans sont regroupés par expérience.

```text
Explorer

Organizer

Operator
```

---

# Expérience Explorer

| ID | Écran | Description |
|----|--------|-------------|
| EXP-001 | Accueil | Point d'entrée de l'expérience Explorer |
| EXP-002 | Recherche | Recherche d'événements |
| EXP-003 | Résultats | Résultats de recherche |
| EXP-004 | Fiche événement | Consultation détaillée d'un événement |
| EXP-005 | Planning | Gestion du planning personnel |
| EXP-006 | Notifications | Consultation des notifications |
| EXP-007 | Profil | Gestion du profil utilisateur |
| EXP-008 | Paramètres | Préférences personnelles |

---

# Expérience Organizer

| ID | Écran | Description |
|----|--------|-------------|
| ORG-001 | Dashboard | Vue d'ensemble de l'activité |
| ORG-002 | Mes événements | Liste des événements |
| ORG-003 | Création / Édition | Création ou modification d'un événement |
| ORG-004 | Validation | Vérification avant publication |
| ORG-005 | Publication | Publication et archivage |
| ORG-006 | Statistiques | Indicateurs d'activité |
| ORG-007 | Profil | Gestion du profil |
| ORG-008 | Paramètres | Préférences personnelles |

---

# Expérience Operator

| ID | Écran | Description |
|----|--------|-------------|
| OPE-001 | Dashboard | Vue globale de la plateforme |
| OPE-002 | Utilisateurs | Administration des utilisateurs |
| OPE-003 | Organisateurs | Administration des organisateurs |
| OPE-004 | Référentiels | Gestion des données de référence |
| OPE-005 | Configuration | Paramètres globaux |
| OPE-006 | Monitoring | Supervision de la plateforme |
| OPE-007 | Journaux | Consultation des journaux |
| OPE-008 | Profil | Gestion du profil |
| OPE-009 | Paramètres | Préférences personnelles |

---

# Métadonnées

Chaque écran est décrit par les informations suivantes.

| Attribut | Description |
|----------|-------------|
| Identifiant | Code unique |
| Nom | Nom officiel |
| Expérience | Explorer, Organizer ou Operator |
| Objectif | Responsabilité principale |
| Utilisateurs | Rôles autorisés |
| User Flows | Parcours utilisant l'écran |
| Composants | Composants principaux |
| Permissions | Permissions requises |
| Version | Version d'introduction |
| Statut | Actif, déprécié, supprimé |

---

# Référencement

Les identifiants d'écran sont utilisés dans :

- User Flows ;
- FSPEC ;
- TSPEC ;
- critères d'acceptation ;
- cas de test ;
- maquettes UX ;
- documentation API lorsque nécessaire.

---

# Cycle de vie

Un écran suit le cycle suivant.

```text
Proposé

↓

Conçu

↓

Validé

↓

Implémenté

↓

En production

↓

Déprécié

↓

Supprimé
```

Un écran déprécié conserve son identifiant.

---

# Gestion des évolutions

Les évolutions d'un écran peuvent concerner :

- son contenu ;
- ses composants ;
- ses interactions ;
- ses règles métier.

L'identifiant reste inchangé.

Une modification majeure entraîne une nouvelle version de la spécification mais pas un nouveau code écran.

---

# Dépréciation

Lorsqu'un écran est remplacé :

- son identifiant est conservé ;
- son statut devient **Déprécié** ;
- l'écran de remplacement est référencé.

Exemple :

```text
EXP-003 Résultats

↓

Déprécié

↓

Remplacé par EXP-009
```

---

# Correspondance avec les expériences

| Expérience | Plage d'identifiants |
|------------|----------------------|
| Explorer | EXP-001 → EXP-099 |
| Organizer | ORG-001 → ORG-099 |
| Operator | OPE-001 → OPE-099 |

Les plages permettent l'ajout futur de nouveaux écrans sans renumérotation.

---

# Correspondance avec les User Flows

| Flow | Écrans |
|------|---------|
| FLOW-001 | EXP-001 → EXP-004 |
| FLOW-002 | EXP-001 → EXP-004 |
| FLOW-003 | EXP-004 → EXP-005 |
| FLOW-004 | EXP-005 |
| FLOW-005 | ORG-001 → ORG-003 |
| FLOW-006 | ORG-002 → ORG-005 |
| FLOW-007 | EXP-007 / ORG-007 / OPE-008 |
| FLOW-008 | OPE-001 → OPE-004 |

---

# Correspondance avec les composants

Chaque écran référence les composants définis dans UISPEC.04.

Exemple :

| Écran | Composants |
|--------|------------|
| EXP-003 | Search Bar, Filters Panel, Event Card, Pagination |
| ORG-003 | Event Form, File Upload, Map Selector |
| OPE-004 | Reference Selector, Toolbar, Data Table |

---

# Correspondance avec les spécifications

Chaque écran peut être relié aux documents suivants.

| Niveau | Exemple |
|---------|----------|
| FSPEC | Gestion du Planning |
| TSPEC | Catalog, Planning |
| UISPEC | Expérience correspondante |
| Flow | FLOW-003 |
| Tests | TC-PLN-001 |

Cette traçabilité garantit l'alignement entre les besoins métier, l'expérience utilisateur, l'architecture et les tests.

---

# Contraintes

Le catalogue respecte les règles suivantes.

- un identifiant unique par écran ;
- un écran appartient à une seule expérience ;
- un identifiant n'est jamais réutilisé ;
- toute évolution conserve la traçabilité documentaire ;
- toute suppression est remplacée par une dépréciation.

---

# Documents liés

00-Glossaire-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

04-UISPEC.08-UserFlows-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première version du catalogue officiel des écrans de la plateforme EventFoundry. |