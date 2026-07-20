# Présentation du planning — Spécification fonctionnelle

**Document** : FSPEC.12

**Fichier** : 02-FSPEC.12-Planning-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire la **présentation du planning** côté Explorer : cartes d'événement avec **image de couverture**,
accueil en deux blocs (**À venir** / **À découvrir**) chacun en **trois sections temporelles**, et
**Mon planning** avec **vues calendrier** (jour / semaine / mois), accès au passé et interactions.

Répond au chantier §4. Rappel du principe fondateur : **le planning est le produit** (STRAT). S'appuie
sur l'existant V2 (participation = qualification ; recommandations ; endpoint calendrier).

---

# Carte d'événement — image de couverture

- Une carte d'événement disposant d'**au moins une image** affiche sa **première image** en couverture.
- **Stratégie de couverture en liste** : les endpoints de liste renvoient aujourd'hui `media: []` ; la
  V3 fournit une **URL de vignette** (idéalement mise en cache / CDN) pour les listes (détail :
  TSPEC.12).
- Sans image : carte avec un visuel de repli (couleur d'univers / activité).

---

# Accueil — deux blocs, trois sections

Chaque bloc est structuré en **trois sections temporelles** : **aujourd'hui**, **cette semaine**,
**ce mois-ci**.

## À venir (mon planning)

Uniquement les événements **qualifiés** par l'utilisateur (intéressé / réservé / payé… = une
participation existe — FSPEC.06 V2). C'est le planning personnel de l'utilisateur.

## À découvrir (recommandations)

Événements **non qualifiés** mais **recommandés** (moteur déterministe — reco). Invitation à enrichir
son planning.

> **[Tranché — chantier §4]** Buckets **disjoints** : *aujourd'hui* / *reste de la semaine* / *reste du
> mois* (recommandation retenue), pour éviter la redondance (aujourd'hui ⊄ semaine ⊄ mois).

---

# Mon planning

Identique au bloc **À venir** de l'accueil, **enrichi** de :

- **Vues calendrier** :
  - **Jour** : heure par heure ;
  - **Semaine** : jour par jour ;
  - **Mois** : grille.
- **Accès au passé** (uniquement ici) : consulter ses événements passés (l'endpoint calendrier V2
  renvoie déjà le passé sans borne).
- **Interactions** : « je ne suis plus intéressé », « j'ai annulé »… via
  `PUT /events/:id/participation` (V2) — tout remettre à neutre retire l'événement du planning
  (FSPEC.06 V2).

> **[à trancher — chantier §4]** Section « plus tard » (> 1 mois) sur Mon planning ? Recommandation :
> une section « plus tard » optionnelle en vue liste, absente des vues calendrier.

---

# Règles fonctionnelles

## RG-PLN-01 — Couverture par la première image

Une carte affiche la **première image** de l'événement si elle existe ; sinon un visuel de repli. La
liste expose une **URL de vignette** (pas le média complet).

## RG-PLN-02 — « À venir » = qualifié

Le bloc/écran « À venir » (et Mon planning) ne contient que les événements ayant une **participation**
(qualifiés). Aucune recommandation ne s'y mêle.

## RG-PLN-03 — « À découvrir » = non qualifié + recommandé

Le bloc « À découvrir » ne contient que des événements **sans participation** proposés par le moteur de
recommandation (déterministe). Un événement qualifié en disparaît (il rejoint « À venir »).

## RG-PLN-04 — Sections disjointes

Les trois sections temporelles sont **disjointes** (aujourd'hui / reste de la semaine / reste du mois),
sans doublon entre sections.

## RG-PLN-05 — Passé réservé à Mon planning

L'accès aux événements passés n'est disponible que dans **Mon planning** (pas sur l'accueil ni la
découverte).

## RG-PLN-06 — Interactions = participation

Les interactions du planning (retirer l'intérêt, annuler…) passent par la **participation** (FSPEC.06
V2). Remettre tous les axes à neutre **retire** l'événement du planning (mais il reste trouvable en
recherche).

## RG-PLN-07 — Fuseau utilisateur

Les sections temporelles et vues calendrier sont calculées dans le **fuseau** de l'utilisateur
(préférence — FSPEC.05) ; le stockage reste en UTC (TSPEC.02 V2).

---

# Correspondance avec la V2

- **Qualifié** = a une participation (mapping direct V2). **Interactions** déjà en place
  (`PUT /events/:id/participation`). L'endpoint **calendrier** renvoie déjà le passé sans borne.
- **Nouveautés V3** : URL de **vignette** en liste (aujourd'hui `media: []`), **vues calendrier**
  (jour/semaine/mois), structuration **3 sections** de l'accueil, bloc **À découvrir** branché sur la
  reco.

---

# Parcours

- **Accueil** : l'utilisateur voit « À venir » (son planning en 3 sections) et « À découvrir » (reco en
  3 sections), cartes à image de couverture.
- **Mon planning** : bascule jour / semaine / mois, remonte dans le passé, interagit (retire/annule).

(Détail des écrans : UISPEC.12 Planning.)

---

# Hors périmètre (V3)

- Édition d'événements depuis le calendrier Explorer (le planning Explorer est en **consultation +
  participation**, pas en édition — l'édition relève de l'Organizer).
- Glisser-déposer d'événements dans le calendrier (Backlog V4).
- Export ICS / synchronisation agenda (hors V1/V3 — Backlog).

---

# Documents liés

(chantier §4) · 03-TSPEC.12-Planning-v3.0 · 04-UISPEC.12-Planning-v3.0 · 02-FSPEC.16 (reco/discovery) ·
(V2) participation `UserParticipation`, endpoint calendrier · 02-FSPEC.05-Preferences-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle de la présentation du planning (couverture, accueil 3 sections, vues calendrier). |
