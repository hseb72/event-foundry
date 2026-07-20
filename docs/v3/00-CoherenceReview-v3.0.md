# Revue de cohérence — documentation V3

**Document** : Revue de cohérence

**Version** : 3.0

**Statut** : Revue (première passe)

---

# Objectif

Relever les incohérences et points d'alignement de la documentation V3 livrée (STRAT, ARCHI.01–04,
ADR.12–23), entre eux et vis-à-vis de la **V2 réellement implémentée**. Les corrections tranchées ont
été appliquées ; les points restants sont marqués **[à trancher]**.

> Périmètre de cette passe : cadre complet lu (vision + 4 ARCHI + ADR.12 principes + ADR.22 identité +
> périmètre des ADR.13–23). Une passe fine par ADR sera faite au fil de la rédaction des FSPEC/TSPEC
> de chaque domaine ; d'éventuelles incohérences additionnelles y seront ajoutées.

---

# 1. Incohérences résolues

## 1.1 Collision de numérotation des ADR (V2 ↔ V3) — RÉSOLU

- **Constat initial** : les ADR V3 étaient numérotés **11 → 22**, or la V2 va déjà jusqu'à **ADR.11**
  (*IdentityRolesExperiencesSubscriptions*). Le numéro 11 était ambigu.
- **Correction appliquée** : la série V3 a été **renumérotée +1 → ADR.12 → 23** (contenus, en-têtes,
  noms de fichiers et renvois croisés). Plus aucun recouvrement avec la V2 (ADR.01–11).

  | Nouveau | Titre |
  |---------|-------|
  | ADR.12 | Platform Architecture Principles |
  | ADR.13 | Import Connector Framework |
  | ADR.14 | Import Pipeline |
  | ADR.15 | Raw Event Model |
  | ADR.16 | AI Boundaries |
  | ADR.17 | Notification Framework |
  | ADR.18 | Organization Domain Model |
  | ADR.19 | Follow Domain Model |
  | ADR.20 | User Preferences Model |
  | ADR.21 | Secrets Management |
  | ADR.22 | Experience Identity Strategy |
  | ADR.23 | Observability Strategy |

## 1.2 « Identité par expérience » (ADR.22) — RÉSOLU (aucun conflit)

- **Constat initial (ma mauvaise lecture)** : « chaque expérience dispose d'une identité propre »
  semblait contredire le modèle V2 (une identité, plusieurs expériences).
- **Clarification** : ADR.22 traite **uniquement l'identité *visuelle et graphique*** de chaque rôle
  (palette, icônes, illustrations, navigation, vocabulaire, tokens de design, thèmes). Le domaine
  métier « ignore totalement les couleurs ». **Aucun conflit** avec le modèle de compte V2 : une seule
  identité, plusieurs rôles attribués, entre lesquels l'utilisateur bascule — avec un **repère visuel
  clair du rôle actif**.
- **Conséquence** : ADR.22 **résout aussi** la question ouverte du chantier §7 — les composants
  utilisent des **tokens** (jamais de couleur en dur) et **la couleur suit l'expérience active**. Une
  page accessible à deux profils change de couleur selon le profil utilisé.

---

# 2. Points à réconcilier avec la V2 implémentée (à porter en FSPEC/TSPEC)

## 2.1 Discovery vs Recommendation

- ARCHI.01/03 regroupent recommandations **et** suivis sous le domaine **Discovery**. La V2 implémente
  **deux modules** : `discovery` (facettes, « Surprends-moi ») et `recommendation` (moteur déterministe,
  feedback). Ce n'est pas une incohérence mais un **regroupement conceptuel** : les FSPEC/TSPEC V3
  préciseront la correspondance (Discovery = facettes + moteur de recommandation + Follow), sans casser
  l'existant.

## 2.2 Complétude du modèle Catalogue (ARCHI.03)

- La section Catalogue liste des « principaux objets » et **omet** des entités bien présentes en V2 :
  `Domain` (sommet de `Domain → Activity → EventType/EventFormat`), `EventType`, `EventFormat`, `Tag`,
  `Alias`, et la géographie `Country/Region/Municipality`. Le libellé « principaux objets » tolère
  l'omission au niveau ARCHI, **mais** les FSPEC *Taxonomy* et *Localization* V3 devront réintégrer
  explicitement ces entités. Non bloquant.

---

# 3. Décisions ouvertes à trancher dans les FSPEC/TSPEC

Points identifiés (voir `00-Chantiers-V3-TODO.md`) à arbitrer dans les specs correspondantes :

- **Notifications** (ADR.17) : rôle du canal interne (toujours actif vs vecteur) ; récaps
  quotidien/hebdo (planificateur vs déclencheur) ; réglage par défaut. Les **deux familles**
  (technique / utilisateur — ARCHI.01) doivent apparaître au FSPEC.
- **Frontière IA** (ADR.16) : « assistance, jamais de décision » — cohérente avec la règle d'or n°1.
  1er cas (IA en remplacement de l'OCR) → alimente le **classifier déterministe**, seul juge des champs.
- **Localisation** : sélection par **pays + code postal**, région dérivée de la ville (chantier §8).
- **Secrets** (ADR.21) : références logiques + chiffrement au repos + jamais en clair — à décliner pour
  les clés IA **par utilisateur** (secret par compte).

---

# 4. Cohérences confirmées (rien à corriger)

- Vision, principes fondateurs (planning = produit, déterminisme, IA d'assistance, expériences
  séparées, connecteurs indépendants, données brutes conservées) : cohérents entre STRAT / ARCHI /
  ADR.12.
- Pipeline d'import (Découverte → Lecture → Extraction → Raw Event → Validation → Normalisation →
  Imported Event → Persistance) : cohérent entre ARCHI.01, ARCHI.02 et ADR.14/15.
- Architecture en couches + Event Bus + infra (PostgreSQL/Redis/MinIO/BullMQ/K8s) : cohérente avec la
  V2 implémentée.

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première passe de revue de cohérence (numérotation ADR et identité visuelle résolues). |
