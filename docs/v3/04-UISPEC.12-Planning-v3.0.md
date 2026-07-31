# Présentation du planning — Spécification d'interface

**Document** : UISPEC.12

**Fichier** : 04-UISPEC.12-Planning-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les écrans Explorer de présentation du planning : **carte d'événement** à couverture, **accueil**
(À venir / À découvrir en 3 sections) et **Mon planning** (vues calendrier). Met en œuvre FSPEC.12 /
TSPEC.12. Couleur Explorer = magenta, via **tokens**, selon l'expérience active (ADR.22).

---

# Composant — Carte d'événement (PLN-01)

**Objectif** : présenter un événement avec sa **couverture**.

**Contenu** : **image de couverture** (1ʳᵉ image, vignette) en haut ; titre, date/heure (fuseau
utilisateur), lieu, activité ; badges de participation (Intéressé/Réservé/Payé…). Sans image : visuel
de repli (couleur d'univers / activité).

**États** : avec image · sans image (repli) · qualifié (badges) · non qualifié.

---

# Écran — Accueil (PLN-02)

**Objectif** : deux blocs, chacun en **3 sections disjointes** (aujourd'hui / cette semaine / ce mois).

## Bloc « À venir »
Événements **qualifiés** (mon planning). Sections : **aujourd'hui**, **cette semaine**, **ce mois-ci**.

## Bloc « À découvrir »
Événements **recommandés non qualifiés**. Mêmes 3 sections. Motivation « recommandé pour vous »
(éventuellement « parce que vous suivez … » — FSPEC.06).

**Actions** : ouvrir un événement · qualifier (participation) depuis la carte · aller à Mon planning.

**États** : contenu · section vide (« rien aujourd'hui ») · découverte vide (« aucune recommandation »).

---

# Écran — Mon planning (PLN-03)

**Objectif** : le planning personnel avec **vues calendrier** et accès au passé.

**Contenu** :
- **Sélecteur de vue** : **Jour** (heure par heure) · **Semaine** (jour par jour) · **Mois** (grille).
- **Navigation temporelle** : précédent / suivant / aujourd'hui ; **accès au passé** (uniquement ici).
- Événements **qualifiés** positionnés selon leur horaire (fuseau utilisateur).
- **Interactions** sur un événement : « je ne suis plus intéressé », « j'ai annulé »… (participation) —
  tout remettre à neutre **retire** l'événement du planning.
- Option **liste** avec section « plus tard » (> 1 mois) — cf. FSPEC.12 [à trancher].

**Actions** : changer de vue · naviguer · ouvrir / interagir avec un événement.

**États** : vue jour/semaine/mois · vide · passé · chargement · erreur.

---

# Comportements

- **Couverture** : première image en vignette, repli sinon (RG-PLN-01).
- **Disjonction** des sections (aujourd'hui / reste de la semaine / reste du mois) — RG-PLN-04.
- **Passé** réservé à Mon planning (RG-PLN-05).
- **Fuseau utilisateur** pour toutes les bornes et positions horaires (RG-PLN-07).
- **Retrait du planning** quand la participation revient à neutre (RG-PLN-06) — l'événement reste
  trouvable en recherche.

---

# Composants

Carte d'événement à couverture · bloc sectionné (3 sections) · sélecteur de vue calendrier · grille
mois · colonne semaine · agenda jour · barre de navigation temporelle · contrôles d'interaction
(participation).

Tokens de design uniquement (jamais de couleur en dur) ; couleur Explorer = magenta selon l'expérience
active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.12-Planning-v3.0 · 03-TSPEC.12-Planning-v3.0 · 04-UISPEC.06-Follow-v3.0 ·
04-UISPEC.13-VisualIdentity-v3.0 · 99-ADR.22 · (V2) UISPEC calendrier / participation

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface de la présentation du planning (carte à couverture, accueil 3 sections, vues calendrier). |
