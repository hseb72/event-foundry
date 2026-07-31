# Interaction Patterns

**Document** : UISPEC.06

**Fichier** : 04-UISPEC.06-InteractionPatterns-v2.0.md

**Version** : 2.0

**Statut** : Spécification

---

# Objectif

Définir les comportements d'interaction communs de la plateforme EventFoundry.

Ce document décrit les règles de comportement des interfaces utilisateur indépendamment des écrans ou des composants utilisés.

Il garantit une expérience utilisateur cohérente entre les expériences Explorer, Organizer et Operator.

---

# Principes

Les interactions reposent sur les principes suivants :

- prévisibilité ;
- cohérence ;
- réactivité ;
- simplicité ;
- accessibilité ;
- tolérance aux erreurs.

Une même action produit toujours un comportement identique dans l'ensemble de l'application.

---

# Classification

Les interactions sont regroupées en huit catégories.

| Code | Catégorie |
|------|-----------|
| INT-01 | Navigation |
| INT-02 | Recherche |
| INT-03 | Sélection |
| INT-04 | Formulaires |
| INT-05 | Actions |
| INT-06 | Feedback |
| INT-07 | Chargement |
| INT-08 | Gestion des erreurs |

---

# INT-01 — Navigation

## Objectif

Permettre des déplacements simples et prévisibles.

### Règles

- conserver le contexte ;
- conserver les filtres ;
- conserver la pagination ;
- conserver la position dans la liste lorsque pertinent.

Une navigation ne provoque jamais une perte de données sans confirmation.

---

# INT-02 — Recherche

## Objectif

Faciliter la découverte d'informations.

### Comportement

Une recherche peut être :

- libre ;
- filtrée ;
- combinée.

Les résultats sont mis à jour dès que possible.

Les critères actifs restent visibles.

---

## Aucun résultat

Lorsque la recherche ne retourne aucun résultat :

- expliquer la situation ;
- afficher les critères actifs ;
- proposer une action.

Exemples :

- supprimer un filtre ;
- modifier la recherche ;
- réinitialiser.

---

# INT-03 — Sélection

## Objectif

Permettre le choix d'un ou plusieurs éléments.

### Règles

La sélection est toujours visible.

Les éléments sélectionnés restent identifiables.

Les actions disponibles dépendent de la sélection.

---

## Sélection multiple

Lorsque plusieurs éléments sont sélectionnés :

- le nombre d'éléments est affiché ;
- les actions compatibles sont proposées.

---

# INT-04 — Formulaires

## Objectif

Garantir une saisie fluide.

### Validation

Les validations sont réalisées :

- immédiatement lorsque possible ;
- au moment de l'enregistrement lorsque nécessaire.

---

## Erreurs

Les erreurs sont affichées :

- au niveau du champ ;
- avec un message explicite.

Les données déjà saisies sont conservées.

---

## Champs obligatoires

Les champs obligatoires sont identifiés visuellement.

---

## Brouillons

Les formulaires longs peuvent être enregistrés comme brouillon.

Le retour sur le formulaire restaure automatiquement les données enregistrées.

---

# INT-05 — Actions

## Objectif

Uniformiser les actions utilisateur.

---

## Création

Une création réussie :

- affiche une confirmation ;
- ouvre l'élément créé ou revient à la liste selon le contexte.

---

## Modification

Une modification :

- conserve le contexte ;
- confirme l'enregistrement.

---

## Suppression

La suppression nécessite une confirmation.

Le message précise :

- l'élément concerné ;
- les conséquences.

La suppression est irréversible sauf indication contraire.

---

## Archivage

L'archivage suit le même comportement que la suppression.

La différence est explicitement expliquée.

---

## Publication

La publication :

- affiche un résumé ;
- demande une confirmation ;
- indique le résultat.

---

# INT-06 — Feedback

## Objectif

Informer l'utilisateur du résultat de ses actions.

---

## Succès

Le message est :

- court ;
- positif ;
- contextualisé.

---

## Avertissement

Les avertissements expliquent les conséquences possibles.

Ils ne bloquent pas nécessairement l'action.

---

## Information

Les informations n'interrompent jamais le travail.

---

## Confirmation

Les confirmations ne sont demandées que pour :

- suppression ;
- archivage ;
- publication ;
- changement ayant des conséquences importantes.

---

# INT-07 — Chargement

## Objectif

Limiter l'attente perçue.

---

## Chargement court

Moins de quelques secondes.

Afficher un indicateur discret.

---

## Chargement long

Afficher :

- une progression lorsque possible ;
- un message.

---

## Chargement progressif

Les informations sont affichées dès leur disponibilité.

---

# INT-08 — Gestion des erreurs

## Objectif

Permettre la récupération après une erreur.

---

## Message

Chaque erreur indique :

- ce qui s'est produit ;
- pourquoi ;
- quoi faire ensuite.

---

## Erreurs de validation

Présentées directement dans le formulaire.

---

## Erreurs techniques

Présenter un message compréhensible.

Les détails techniques restent invisibles.

---

## Erreurs réseau

Proposer :

- réessayer ;
- revenir ;
- enregistrer plus tard lorsque possible.

---

# États d'un écran

Chaque écran peut présenter les états suivants.

```text
Chargement

↓

Disponible

↓

Modification

↓

Enregistrement

↓

Succès
```

ou

```text
Chargement

↓

Erreur
```

ou

```text
Chargement

↓

Aucune donnée
```

---

# États d'un composant

Un composant interactif peut être :

- actif ;
- inactif ;
- désactivé ;
- sélectionné ;
- survolé ;
- focalisé ;
- en chargement.

Les transitions entre états sont visuellement explicites.

---

# Raccourcis clavier

Les interactions principales restent accessibles au clavier.

Exemples :

- navigation ;
- validation ;
- fermeture d'une boîte de dialogue ;
- recherche.

Le focus est toujours visible.

---

# Gestes tactiles

Sur les appareils mobiles :

- toucher ;
- défilement ;
- pincement (lorsque pertinent) ;
- glissement (lorsque pertinent).

Les gestes ne remplacent jamais une action indispensable.

---

# Undo / Redo

Lorsque pertinent, une action annulable propose une période de récupération.

Exemples :

- suppression d'un élément du planning ;
- archivage récent.

Les opérations irréversibles sont clairement identifiées.

---

# Prévention des erreurs

L'interface privilégie :

- la prévention ;
- la validation précoce ;
- les valeurs par défaut pertinentes ;
- la désactivation des actions impossibles.

---

# Accessibilité

Toutes les interactions respectent les principes suivants.

- accessibles au clavier ;
- compatibles avec les lecteurs d'écran ;
- focus visible ;
- temps suffisant pour agir.

Aucune interaction ne dépend uniquement de la couleur.

---

# Responsive

Les interactions restent cohérentes sur :

- ordinateur ;
- tablette ;
- smartphone.

La gestuelle peut évoluer mais jamais le comportement fonctionnel.

---

# Contraintes

Toutes les interactions respectent les principes suivants.

- comportement uniforme ;
- messages compréhensibles ;
- confirmation uniquement lorsque nécessaire ;
- aucune perte de données sans avertissement ;
- accessibilité native ;
- conservation du contexte utilisateur.

Toute dérogation doit être justifiée.

---

# Documents liés

00-Glossaire-v2.0

04-UISPEC.00-DesignPrinciples-v2.0

04-UISPEC.01-ExplorerExperience-v2.0

04-UISPEC.02-OrganizerExperience-v2.0

04-UISPEC.03-OperatorExperience-v2.0

04-UISPEC.04-SharedComponents-v2.0

04-UISPEC.05-NavigationModel-v2.0

04-UISPEC.07-ScreenCatalogue-v2.0

04-UISPEC.08-UserFlows-v2.0

---

# Historique

| Version | Description |
|----------|-------------|
| 2.0 | Première spécification des modèles d'interaction de la plateforme. |