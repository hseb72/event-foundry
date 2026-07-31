# Notifications — Spécification d'interface

**Document** : UISPEC.04

**Fichier** : 04-UISPEC.04-Notification-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les écrans de notification : **historique in-app** et **préférences** côté Explorer,
**administration globale** (vecteurs / fréquences) côté Operator. Met en œuvre FSPEC.04 / TSPEC.04 et
l'identité visuelle par rôle (ADR.22 : tokens, couleur selon l'expérience active).

---

# Écrans Explorer

## EXP-NOTIF-01 — Centre de notifications (in-app)

**Objectif** : consulter l'**historique** des notifications (toujours disponible — le in-app est
l'historique de référence, FSPEC.04).

**Contenu** : liste chronologique (icône de famille technique/utilisateur, titre, résumé, date, état
lu/non lu, lien vers l'objet — import, événement…). **Badge** de non-lus dans la navigation (existant
V2). Filtres : famille (technique/utilisateur), lu/non lu.

**Actions** : ouvrir (→ objet lié) · marquer lu · tout marquer lu.

**États** : chargement · liste · vide (« aucune notification ») · erreur.

---

## EXP-NOTIF-02 — Préférences de notification

**Objectif** : régler, **par piste de fréquence active**, le **vecteur** souhaité (ou « aucun »)
(RG-NOTIF-03/04).

**Contenu** — une ligne par **fréquence active** (activée globalement par l'Operator) :

| Fréquence | Vecteur (choix) |
|-----------|-----------------|
| Immédiat | aucun · in-app · email · push |
| Récap quotidien | aucun · in-app · email · push |
| Récap hebdomadaire | aucun · in-app · email · push |

- Seules les **fréquences/vecteurs actifs globalement** sont proposés ; les autres sont masqués ou
  grisés avec explication.
- Rappel : le **in-app reste l'historique** ; ces réglages pilotent surtout les **envois sortants**.
- Valeurs par défaut d'un nouvel utilisateur : in-app actif + récap hebdo email (FSPEC.04).

**Actions** : enregistrer les préférences.

> Ces préférences font partie du **menu profil** (FSPEC.11) et du **modèle User Preferences**
> (FSPEC.05) — source unique.

---

# Écran Operator

## OPE-NOTIF-01 — Administration des notifications

**Objectif** : activer/désactiver **globalement** les **vecteurs** et **fréquences** (chantier §1 ;
permission `notification.manage`).

**Contenu** :
- **Vecteurs** : in-app (toujours actif, non désactivable — historique), email, push → activer/désactiver.
- **Fréquences** : immédiate, quotidienne, hebdomadaire → activer/désactiver (pistes indépendantes).
- **Dépendances** : email/push nécessitent la **configuration mail / push** (écran OPE Configuration —
  FSPEC.09) ; un vecteur sans configuration valide est signalé « à configurer ».
- **Métriques** : volumes envoyés, taux de succès/échec par canal (ADR.23).

**Actions** : basculer un vecteur/fréquence · ouvrir la configuration liée · consulter les métriques.

**États** : actif · inactif · à configurer (dépendance manquante).

---

# Composants

Liste de notifications (icônes de famille) · badge de non-lus · grille de préférences fréquence ×
vecteur · panneau d'administration vecteurs/fréquences · cartes de métriques de livraison.

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22) :
Explorer = magenta, Operator = violet.

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.04-Notification-v3.0 · 03-TSPEC.04-Notification-v3.0 · 02-FSPEC.05-Preferences-v3.0 ·
04-UISPEC.11-Profile-v3.0 · 99-ADR.17/20/22/23 · (V2) badge & API notifications

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface des notifications (centre in-app, préférences, administration globale). |
