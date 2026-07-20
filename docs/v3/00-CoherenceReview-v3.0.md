# Revue de cohérence — documentation V3

**Document** : Revue de cohérence

**Version** : 3.0

**Statut** : Revue (première passe)

---

# Objectif

Relever les incohérences et points d'alignement de la documentation V3 livrée (STRAT, ARCHI.01–04,
ADR.11–22), entre eux et vis-à-vis de la **V2 réellement implémentée**. Les corrections sûres sont
appliquées ; les arbitrages sont marqués **[à trancher]** et n'ont pas été modifiés unilatéralement.

> Périmètre de cette passe : cadre complet lu (vision + 4 ARCHI + ADR.11 + périmètre des ADR.12–22).
> Une passe fine par ADR sera faite au fil de la rédaction des FSPEC/TSPEC de chaque domaine ;
> d'éventuelles incohérences additionnelles y seront ajoutées.

---

# 1. Incohérences bloquantes

## 1.1 Collision de numérotation des ADR (V2 ↔ V3)

- **Constat** : les ADR V3 sont numérotés **11 → 22**. Or la V2 a déjà **ADR.01 → 11**. Le numéro
  **ADR.11** désigne donc deux décisions différentes : V2 = *IdentityRolesExperiencesSubscriptions*
  (`docs/v2/`) ; V3 = *PlatformArchitecturePrinciples* (`docs/v3/`).
- **Impact** : ambiguïté de référencement (« ADR.11 » n'est plus univoque). Les ADR.12–22 ne
  collisionnent pas avec la V2 (max V2 = 11), seul le 11 pose un vrai conflit.
- **[à trancher]** Deux options :
  - **(A) Namespacing par dossier** (zéro churn) : acter que `docs/v3/` forme une **série ADR
    indépendante**, citée « ADR-V3.11 » etc. → seule la convention de citation change.
  - **(B) Renumérotation** : décaler la série V3 pour éviter tout recouvrement (p. ex. principes =
    ADR.12, puis 13→23), avec mise à jour des renvois croisés (churn sur ~12 fichiers).
  - **Recommandation** : **(A)** — les deux séries vivent dans des dossiers distincts et couvrent des
    versions distinctes ; le namespacing par dossier est le plus lisible et sans risque.

---

# 2. Points à réconcilier avec la V2 implémentée

## 2.1 Identité par expérience (ADR.21) vs identité unique multi-expériences (V2)

- **Constat** : ADR.21 (*Experience Identity Strategy*) pose « **chaque expérience dispose d'une
  identité propre** ». La V2 implémente l'inverse : **une seule identité** exerçant **plusieurs
  expériences** (V2 ADR.10 *MultiExperiencePlatform* + ADR.11 *IdentityRolesExperiencesSubscriptions*
  ; `computeEffectiveIdentity`, `activeExperience`).
- **[à trancher / à vérifier]** Est-ce une **évolution volontaire** (V3 sépare les identités) ou une
  formulation à préciser (identité unique, *contexte* propre par expérience) ? À clarifier avant de
  rédiger le FSPEC/TSPEC Identity — l'écart est structurant (auth, RBAC, portails). Non modifié ici.

## 2.2 Discovery vs Recommendation

- **Constat** : ARCHI.01/03 regroupent recommandations **et** suivis sous le domaine **Discovery**.
  La V2 implémente **deux modules** : `discovery` (navigation à facettes, « Surprends-moi ») et
  `recommendation` (moteur déterministe, feedback). 
- **Action** : pas une incohérence — un **regroupement conceptuel**. Les FSPEC/TSPEC V3 préciseront
  la correspondance (Discovery = facettes + moteur de recommandation + Follow), sans casser
  l'existant.

## 2.3 Complétude du modèle Catalogue (ARCHI.03)

- **Constat** : la section Catalogue liste « principaux objets » : Event, Venue, Organizer, Activity,
  Category, EventMedia. Elle **omet** des entités bien présentes en V2 : `Domain` (sommet de la
  taxonomie `Domain → Activity → EventType/EventFormat`), `EventType`, `EventFormat`, `Tag`, `Alias`,
  et la géographie `Country/Region/Municipality`.
- **Action** : le libellé « principaux objets » tolère l'omission au niveau ARCHI, **mais** le FSPEC
  *Taxonomy* et le FSPEC *Localization* V3 devront réintégrer explicitement ces entités pour rester
  cohérents avec la base. Non bloquant ; à couvrir en FSPEC. (Aligné avec le chantier §8 Localisation.)

---

# 3. Alignements à porter dans les FSPEC/TSPEC (questions ouvertes héritées)

Ces points ne sont pas des incohérences mais des **décisions ouvertes** déjà identifiées (voir
`00-Chantiers-V3-TODO.md`) à trancher dans les specs correspondantes :

- **Notifications** (ADR.16) : rôle du canal interne (toujours actif vs vecteur) ; récaps
  quotidien/hebdo (planificateur vs déclencheur) ; réglage par défaut. + les **deux familles**
  (technique / utilisateur) posées en ARCHI.01 doivent apparaître dans le FSPEC.
- **Frontière IA** (ADR.15) : confirmée « assistance, jamais de décision » — cohérente avec la
  règle d'or n°1. Le 1er cas (IA en remplacement de l'OCR) alimente le **classifier déterministe**,
  qui reste seul juge des champs métier.
- **Localisation** : sélection par **pays + code postal**, région dérivée de la ville (chantier §8).
- **Secrets** (ADR.20) : références logiques + chiffrement au repos + jamais en clair — à décliner
  pour les clés IA **par utilisateur** (secret par compte).

---

# 4. Cohérences confirmées (rien à corriger)

- Vision, principes fondateurs (planning = produit, déterminisme, IA d'assistance, expériences
  séparées, connecteurs indépendants, données brutes conservées) : **cohérents** entre STRAT / ARCHI /
  ADR.11.
- Pipeline d'import (Découverte → Lecture → Extraction → Raw Event → Validation → Normalisation →
  Imported Event → Persistance) : **cohérent** entre ARCHI.01, ARCHI.02 et ADR.13/14.
- Architecture en couches + Event Bus + infra (PostgreSQL/Redis/MinIO/BullMQ/K8s) : **cohérente**
  avec la V2 implémentée.

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première passe de revue de cohérence de la documentation V3. |
