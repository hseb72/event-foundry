# UISPEC.14 – Cartes extensibles (Expandable Cards)

**Document** : UISPEC.14

**Fichier** : 04-UISPEC.14-ExpandableCards.md

**Version** : 3.0

**Statut** : Validé
---

# 1. Objectif

Les pages de configuration d'EventFoundry présentent de nombreuses cartes contenant des formulaires ou des informations de longueur très variable.

Afin d'améliorer :

- la lisibilité,
- la densité d'information,
- la cohérence visuelle,

toutes les cartes utilisent un **comportement extensible standardisé**.

Le composant permet de conserver une grille homogène tout en donnant accès à l'intégralité du contenu lorsqu'il est nécessaire.

---

# 2. Principes UX

## 2.1 Etat compact

Par défaut, toutes les cartes sont affichées dans leur état **compact**.

Caractéristiques :

- hauteur identique pour toutes les cartes d'une même page ;
- contenu tronqué si nécessaire ;
- footer toujours visible ;
- grille parfaitement régulière.

Le mode compact permet une lecture rapide de l'ensemble des paramètres disponibles.

---

## 2.2 Etat développé

L'utilisateur peut développer individuellement une carte.

Dans cet état :

- la hauteur devient automatique ;
- l'intégralité du contenu est visible ;
- les autres cartes ne sont pas impactées ;
- la largeur reste identique.

Le changement d'état ne modifie jamais les données affichées.

---

# 3. Comportement

Chaque carte possède deux états :

- Compact
- Développé

Le changement d'état est instantané ou animé.

L'état est purement local à la page.

---

# 4. Règles d'affichage

## Mode compact

- hauteur fixe
- footer toujours visible
- contenu masqué après la hauteur maximale
- fondu visuel indiquant que du contenu est disponible

Exemple :

```
┌──────────────────────────────┐
│ Sécurité                     │
├──────────────────────────────┤
│                              │
│ Changer le mot de passe       │
│ Mot de passe actuel           │
│ Nouveau mot de passe          │
│                              │
│     ░░░░ fondu ░░░░░░░        │
├──────────────────────────────┤
│         ▼ Développer          │
└──────────────────────────────┘
```

---

## Mode développé

```
┌──────────────────────────────┐
│ Sécurité                     │
├──────────────────────────────┤
│                              │
│ ... contenu complet ...       │
│                              │
│                              │
├──────────────────────────────┤
│          ▲ Réduire           │
└──────────────────────────────┘
```

---

# 5. Footer

Le footer appartient visuellement à la carte.

Il contient :

- le bouton Développer
- le bouton Réduire

Le footer reste toujours visible.

Il ne disparaît jamais.

---

# 6. Indicateur de contenu masqué

Lorsque la carte est compacte, le contenu ne doit jamais être coupé brutalement.

Un dégradé vertical est affiché sur les derniers pixels visibles.

Exemple :

```
██████████████████
██████████████████
██████████████████
██████████████████
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
░░░░░░░░░░░░░░░░░░
```

Ce dégradé indique naturellement que la carte contient davantage d'informations.

---

# 7. Visibilité du bouton

Le bouton **Développer** n'est affiché que si le contenu dépasse la hauteur compacte.

Les cartes courtes ne présentent aucun bouton.

Exemple :

| Carte | Bouton |
|---------|--------|
| Session | Non |
| Rôles | Non |
| Sécurité | Oui |
| Configuration IA | Oui |
| Organisation | Oui |

Cette règle est déterminée automatiquement.

---

# 8. Animation

Le changement d'état utilise une animation douce.

Durée recommandée :

- 250 à 350 ms

Courbe :

```
ease
```

Aucune animation complexe n'est utilisée.

---

# 9. Grille

Les cartes sont affichées dans une grille responsive.

Chaque carte conserve :

- sa largeur
- sa colonne

Le développement d'une carte ne modifie pas les autres colonnes.

---

# 10. Responsive

Le comportement est identique :

- Desktop
- Tablette
- Mobile

Seule la largeur des cartes varie.

---

# 11. Accessibilité

Le bouton possède :

- un rôle Button
- un libellé explicite

Exemples :

```
Développer la carte Sécurité
```

```
Réduire la carte Sécurité
```

Le bouton est accessible :

- clavier
- lecteur d'écran

---

# 12. Design

Le footer utilise :

- la même couleur de fond que la carte ;
- une bordure discrète (`--border`) ;
- un bouton de type lien utilisant la couleur de l'expérience (`--exp`).

Le composant respecte intégralement les tokens définis dans :

- UISPEC.13 – Visual Identity.

Aucune couleur codée en dur n'est autorisée.

---

# 13. Persistance

L'état développé d'une carte n'est pas persisté.

Lors du rechargement de la page, toutes les cartes reviennent dans leur état compact.

---

# 14. Evolution

Le composant pourra ultérieurement supporter :

- Développer toutes les cartes
- Réduire toutes les cartes
- Persistance locale (LocalStorage)
- Persistance dans les préférences utilisateur
- Ouverture automatique de la dernière carte consultée

Ces fonctionnalités ne font pas partie de la V1 du composant.

# Documents liés



---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Description détaillée de la représentation d'une catégorie de configuration sous forme de carte extensible. |