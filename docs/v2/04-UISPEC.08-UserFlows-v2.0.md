# User Flows

**Document** : UISPEC.08

**Fichier** : 04-UISPEC.08-UserFlows-v2.1.md

**Version** : 2.1

**Statut** : Spécification

---

# Objectif

Décrire les parcours utilisateurs de la plateforme EventFoundry.

Chaque User Flow représente un scénario métier complet permettant à un utilisateur d'atteindre un objectif fonctionnel.

Contrairement aux documents décrivant les écrans ou la navigation, les User Flows sont organisés autour des objectifs de l'utilisateur.

Ils constituent le point de convergence entre :

- les besoins métier (FSPEC) ;
- l'architecture technique (TSPEC) ;
- l'expérience utilisateur (UISPEC) ;
- les critères d'acceptation ;
- les tests fonctionnels.

---

# Principes

Un User Flow :

- poursuit un objectif unique ;
- est associé à un acteur identifié ;
- décrit un scénario complet ;
- référence les écrans concernés ;
- référence les composants utilisés ;
- référence les règles métier ;
- référence les services techniques ;
- définit les critères d'acceptation.

Les User Flows sont indépendants de toute implémentation technique.

---

# Structure d'un User Flow

Chaque User Flow suit la structure suivante.

1. Objectif

2. Acteurs

3. Déclencheur

4. Préconditions

5. Postconditions

6. Scénario nominal

7. Scénarios alternatifs

8. Exceptions

9. Écrans traversés

10. Composants utilisés

11. Règles métier concernées (FSPEC)

12. Services sollicités (TSPEC)

13. Données manipulées

14. Permissions

15. Critères d'acceptation

16. Contraintes UX

17. Traçabilité

---

# Catalogue des User Flows

| ID | Parcours | Acteur |
|----|----------|---------|
| FLOW-001 | Découvrir un événement | Explorer |
| FLOW-002 | Rechercher un événement | Explorer |
| FLOW-003 | Ajouter un événement au Planning | Explorer |
| FLOW-004 | Gérer son Planning | Explorer |
| FLOW-005 | Créer un événement | Organizer |
| FLOW-006 | Publier un événement | Organizer |
| FLOW-007 | Changer d'expérience | Utilisateur |
| FLOW-008 | Administrer un référentiel | Operator |

---

# Modèle de spécification

Le modèle suivant est utilisé pour tous les User Flows.

---

## FLOW-XXX — Nom du parcours

### 1. Objectif

Décrire le résultat attendu du parcours utilisateur.

---

### 2. Acteurs

Identifier les rôles autorisés.

---

### 3. Déclencheur

Décrire l'action ou l'événement initiant le parcours.

---

### 4. Préconditions

Lister les conditions devant être satisfaites avant le démarrage du scénario.

Exemples :

- utilisateur authentifié ;
- rôle requis ;
- données disponibles ;
- permissions suffisantes.

---

### 5. Postconditions

Décrire l'état attendu après exécution du scénario.

Exemples :

- données créées ;
- données modifiées ;
- notifications émises ;
- navigation effectuée.

---

### 6. Scénario nominal

Décrire le déroulement normal du parcours.

Le scénario est présenté sous forme d'étapes ordonnées.

---

### 7. Scénarios alternatifs

Décrire les variantes fonctionnelles.

Exemples :

- conflit détecté ;
- données déjà existantes ;
- confirmation supplémentaire ;
- options utilisateur.

---

### 8. Exceptions

Décrire les situations empêchant l'aboutissement normal du scénario.

Exemples :

- perte réseau ;
- session expirée ;
- service indisponible ;
- permission insuffisante.

Chaque exception précise le comportement attendu de l'interface.

---

### 9. Écrans traversés

Lister les écrans du catalogue UISPEC.07.

Exemple :

| ID | Écran |
|----|--------|
| EXP-004 | Fiche événement |
| EXP-005 | Planning |

---

### 10. Composants utilisés

Lister les composants définis dans UISPEC.04.

Exemple :

- Event Card
- Planning Card
- Confirmation Dialog
- Notification Toast

---

### 11. Règles métier concernées

Référencer les spécifications fonctionnelles impliquées.

Exemple :

- FSPEC Catalog
- FSPEC Planning

Préciser les principales règles métier appliquées.

---

### 12. Services sollicités

Référencer les domaines techniques concernés.

Exemple :

- Catalog
- Planning
- Notifications

Préciser les principales interactions entre services.

---

### 13. Données manipulées

Identifier les objets métier :

Lecture :

- Event
- Planning

Création :

- PlanningEntry

Modification :

- Planning

Événements produits :

- EventAddedToPlanning

---

### 14. Permissions

Identifier :

- rôle requis ;
- permissions nécessaires ;
- restrictions éventuelles.

---

### 15. Critères d'acceptation

Définir les critères permettant de valider le parcours.

Les critères sont exprimés sous forme de résultats observables.

Exemple :

- un seul objet est créé ;
- aucun doublon ;
- confirmation affichée ;
- données immédiatement visibles.

---

### 16. Contraintes UX

Décrire les exigences ergonomiques.

Exemples :

- conservation du contexte ;
- retour arrière sans perte ;
- temps de réponse perçu minimal ;
- accessibilité clavier ;
- responsive.

---

### 17. Traçabilité

Chaque User Flow référence :

| Élément | Référence |
|----------|-----------|
| User Experience | UX |
| Écrans | UISPEC.07 |
| Navigation | UISPEC.05 |
| Interactions | UISPEC.06 |
| Composants | UISPEC.04 |
| Règles métier | FSPEC |
| Services | TSPEC |
| Tests QA | Cas de test |

---

# Gestion des évolutions

Un User Flow peut évoluer :

- par ajout d'un scénario alternatif ;
- par ajout d'une exception ;
- par modification des écrans traversés ;
- par évolution des règles métier.

Son identifiant reste inchangé.

---

# Contraintes

Les User Flows respectent les principes suivants.

- un objectif métier unique ;
- un acteur principal ;
- un scénario nominal ;
- des scénarios alternatifs clairement identifiés ;
- une gestion explicite des exceptions ;
- une traçabilité complète vers les autres spécifications.

Toute évolution doit préserver la cohérence avec les documents FSPEC, TSPEC et UISPEC.

---

# Documents liés

00-Glossaire-v2.0

00-STRAT.02-UserExperiences-v2.0

01-FSPEC.*

03-TSPEC.*

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.06-InteractionPatterns-v2.0

04-UISPEC.07-ScreenCatalogue-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première version des User Flows. |
| 2.1 | Refonte complète : les User Flows deviennent des scénarios métier complets intégrant préconditions, variantes, exceptions, traçabilité, règles métier, services techniques et critères d'acceptation. |