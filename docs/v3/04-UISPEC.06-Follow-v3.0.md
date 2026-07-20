# Suivis (Follow) — Spécification d'interface

**Document** : UISPEC.06

**Fichier** : 04-UISPEC.06-Follow-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire les points d'interface du domaine **Follow** : action « Suivre » sur les fiches, et gestion des
suivis depuis le tableau de bord / menu profil. Met en œuvre FSPEC.06 / TSPEC.06. Couleur pilotée par
des **tokens** selon l'expérience active (ADR.22 — Explorer = magenta).

---

# Composant — Bouton « Suivre » (FOL-01)

**Objectif** : suivre / ne plus suivre un objet suivable (organisation, organisateur, lieu, activité,
catégorie, série).

**Contenu** : bouton à deux états (**Suivre** / **Suivi**) présent sur les fiches concernées ; au survol
de « Suivi », option « Ne plus suivre ». Menu secondaire optionnel : **suspendre les notifications** de
ce suivi (`notify`).

**États** : non suivi · suivi (notifications actives) · suivi (notifications suspendues) · en cours ·
erreur.

**Comportement** : idempotent — re-suivre un objet précédemment suivi réactive le suivi.

---

# Écran — Mes suivis (FOL-02)

**Objectif** : gérer l'ensemble de ses suivis (chantier §6), accessible depuis le **tableau de bord**
Explorer et le **menu profil** (FSPEC.11).

**Contenu** : liste groupée par **type d'objet** (organisations, organisateurs, lieux, activités…) ;
par ligne : nom de l'objet, date de suivi, état (actif/suspendu), bascule **notifications**.

**Actions** : ouvrir la fiche · **suspendre / réactiver** · **ne plus suivre** · régler les notifications
par suivi.

**États** : chargement · liste · vide (« vous ne suivez encore rien » + suggestions) · erreur.

---

# Intégrations

- **Découverte / recommandations** : les objets suivis pondèrent les propositions (« parce que vous
  suivez … ») — mise en avant, jamais exclusive (RG-FOL-05).
- **Notifications** : un nouvel événement d'un objet suivi peut générer une notification « information
  Explorer » selon les préférences (EXP-NOTIF-01/02) et le réglage `notify` du suivi.

---

# Composants

Bouton Suivre/Suivi (avec bascule notifications) · liste de suivis groupée par type · état vide avec
suggestions · indicateur « suivi suspendu ».

Tokens de design uniquement (jamais de couleur en dur) ; couleur selon l'expérience active (ADR.22).

---

# États communs

Chaque écran prévoit : chargement · succès · vide · erreur (comportements UISPEC.06 V2).

---

# Documents liés

02-FSPEC.06-Follow-v3.0 · 03-TSPEC.06-Follow-v3.0 · 04-UISPEC.04-Notification-v3.0 ·
04-UISPEC.11-Profile-v3.0 · 99-ADR.19/17/22

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification d'interface des suivis (bouton Suivre, écran Mes suivis, intégrations). |
