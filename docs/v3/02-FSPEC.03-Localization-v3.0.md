# Localisation — Spécification fonctionnelle

**Document** : FSPEC.03

**Fichier** : 02-FSPEC.03-Localization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la capacité de **localisation** de la V3 : sélectionner et rechercher un lieu par **pays +
code postal**, la **région étant dérivée** de la commune (jamais saisie). Simplifie l'expérience de la
V2 (cascade pays / région / ville) et alimente les **adresses d'organisation** (FSPEC.02) ainsi que la
localisation des événements.

Source : chantier §8.1 (sélection par pays + code postal) et ADR.18 (adresses). Aucun modèle métier
n'est pris par une IA : la résolution `pays + code postal → commune(s)` est **déterministe** (référentiel
géographique).

---

# Acteurs

- **Organizer** — localise une organisation (adresses) et les événements créés manuellement.
- **Explorer** — recherche/filtre des événements par proximité (pays + code postal).
- **Système** — normalise les localisations issues des imports (pipeline — FSPEC.01).

---

# Modèle de localisation (rappel & cible)

- **V2 (existant)** : hiérarchie `Country → Region → Municipality` ; la commune porte le `postalCode` ;
  l'`Event` pointe une commune (`municipalityId`) ; le formulaire propose **trois sélecteurs en
  cascade** (pays / région / ville).
- **V3 (cible)** : l'utilisateur choisit **un pays** puis saisit un **code postal** → la plateforme
  **résout la ou les commune(s)** correspondantes. La **région est une conséquence de la commune**
  (affichée en lecture seule, jamais choisie).

> **Invariant préservé** : la commune reste l'unité de localisation stockée (`municipalityId`). La V3
> change **le mode de sélection** (plus efficace), pas l'unité de référence.

---

# Règles fonctionnelles

## RG-LOC-01 — Sélection par pays + code postal

La saisie combine **pays** (obligatoire) et **code postal**. La résolution retourne les communes du
pays dont le code postal correspond. Aucune autre saisie géographique n'est requise.

## RG-LOC-02 — Région dérivée

La **région** n'est jamais saisie ni filtrée directement : elle est **déduite** de la commune retenue
et présentée en lecture seule. (Alignement chantier §8.1 et règle d'or « Domain déduit » — même esprit.)

## RG-LOC-03 — Désambiguïsation

Un code postal peut couvrir **plusieurs communes** (ou une commune plusieurs codes). Si la résolution
renvoie plusieurs communes, l'utilisateur **choisit** dans la liste proposée. Si aucune n'est trouvée,
un message explicite est affiché ; aucune commune n'est inventée.

## RG-LOC-04 — Indexation du code postal

Le `postalCode` est **indexé** (non indexé en V2) pour une recherche performante par pays + code postal.

## RG-LOC-05 — Adresses d'organisation proposées

À la **création manuelle d'un événement**, les **adresses de l'organisation active** (FSPEC.02) sont
proposées comme localisations ; l'utilisateur peut toujours saisir une autre localisation (RG-ORG-06).

## RG-LOC-06 — Normalisation à l'import

Le pipeline d'import normalise les localisations source vers une commune du référentiel (pays + code
postal + libellé). En cas d'ambiguïté non résoluble automatiquement, la localisation reste **à valider**
par l'utilisateur (EventCandidate) — aucune déduction métier par IA.

---

# Statut de la région dans le modèle

**[à trancher — porté en TSPEC.03]** Deux options pour la place de `Region` :

- *option A* — **conserver** `Region` comme niveau de hiérarchie (`Country → Region → Municipality`),
  la région étant seulement **dérivée à l'affichage** (aucun sélecteur). Impact minimal sur la V2.
- *option B* — **rétrograder** `Region` en simple **attribut** de la commune.

Recommandation : **option A** (conserver la hiérarchie, masquer le sélecteur) — évite une migration
lourde, préserve les rapprochements existants, satisfait la cible fonctionnelle (région dérivée).

---

# Parcours

- **Localiser une adresse / un événement** : choisir le pays → saisir le code postal → sélectionner la
  commune (si plusieurs) → la région s'affiche (lecture seule) → compléter la rue si adresse.
- **Rechercher des événements à proximité** : pays + code postal → résultats de la ou des communes
  correspondantes (Discovery / Search).

(Détail des écrans : UISPEC.03 Localization.)

---

# Correspondance avec la V2

- Référentiel `Country/Region/Municipality` **conservé** ; l'`Event` continue de pointer une commune.
- La **cascade à 3 sélecteurs** est remplacée par **pays + code postal + désambiguïsation**.
- Le `postalCode`, déjà présent sur la commune, devient **indexé** et **clé de recherche**.

---

# Hors périmètre (V3)

- Géocodage fin / cartographie / rayon kilométrique (Backlog V4).
- Import massif de référentiels postaux tiers automatisé (opération d'exploitation, hors spec fonctionnelle).

---

# Documents liés

02-FSPEC.02-Organization-v3.0 · 03-TSPEC.03-Localization-v3.0 · 04-UISPEC.03-Localization-v3.0 ·
99-ADR.18-OrganizationDomainModel · 01-ARCHI.03-Catalog-v3.0 · (V2) référentiel géographique

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de la localisation par pays + code postal (région dérivée). |
