# Suivis (Follow) — Spécification fonctionnelle

**Document** : FSPEC.06

**Fichier** : 02-FSPEC.06-Follow-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le domaine **Follow** : une **entité métier indépendante** représentant la relation durable
entre un utilisateur et un objet suivi (organisation, organisateur, lieu, activité, catégorie, série
d'événements). Le suivi alimente la **découverte**, les **recommandations**, les **notifications
utilisateur** et les **statistiques**.

Met en œuvre **ADR.19** (Follow Domain Model), en lien avec **ADR.17** (notifications) et **ADR.20**
(préférences). Répond au chantier §6 (prérequis des notifications « information Explorer »).

> **Le Follow n'est pas une préférence** (ADR.19) : il a un **cycle de vie propre** et des
> **métadonnées**. Les préférences (FSPEC.05) peuvent référencer des favoris, mais le suivi reste une
> entité distincte.

---

# Objets suivables (ADR.19)

`Organization`, `Organizer`, `Venue`, `Activity`, `Category`, `Event Series`. Liste **extensible** :
ajouter un type ne remet pas en cause le modèle.

> **Découplage** (ADR.19) : les objets suivis **ne connaissent jamais** leurs abonnés. Le Follow est
> l'**unique point de liaison** ; les domaines métier restent indépendants.

---

# Cycle de vie (ADR.19)

```
Créé → Suspendu ⇄ Réactivé → Supprimé
```

- **Créé** : l'utilisateur suit un objet.
- **Suspendu / Réactivé** : le suivi est mis en pause sans être perdu (ex. « ne plus recevoir de
  notifications, mais conserver le suivi »).
- **Supprimé** : l'utilisateur ne suit plus l'objet.

Chaque changement est **historisé**.

---

# Métadonnées (ADR.19)

Un Follow peut porter : **date de création**, **origine** du suivi (manuel, suggestion…), **priorité**,
**notifications activées** (au niveau du suivi), commentaires internes. Ces informations enrichissent
la relation **sans modifier** l'objet suivi.

---

# Règles fonctionnelles

## RG-FOL-01 — Entité indépendante

Le Follow est une entité métier à cycle de vie propre, distincte des préférences (RG-PREF) et des
participations (FSPEC.06 V2 — `UserParticipation` reste distinct : la participation concerne un
**événement précis**, le suivi concerne un **objet durable**).

## RG-FOL-02 — Relation Many-to-Many

Un utilisateur suit plusieurs objets ; un objet est suivi par plusieurs utilisateurs. Le Follow est
l'entité de liaison. **Unicité** : un seul Follow actif par `(utilisateur, objet)`.

## RG-FOL-03 — Découplage des objets suivis

Les objets suivis ignorent leurs abonnés. Toute exploitation (reco, notif, recherche) passe par le
modèle Follow, jamais par l'objet.

## RG-FOL-04 — Alimente notifications utilisateur

La publication d'un événement lié à un objet suivi **peut** générer une notification « information
Explorer » (FSPEC.04), **selon les préférences** de l'utilisateur (vecteur/fréquence) et le réglage
« notifications activées » du suivi. Aucune notification imposée.

## RG-FOL-05 — Alimente découverte & recommandations

Les objets suivis constituent un **signal de pertinence** pour les recommandations (moteur déterministe)
et la mise en avant en recherche. Le suivi n'impose jamais un résultat ; il **pondère**.

## RG-FOL-06 — Suspension sans perte

Un suivi suspendu ne déclenche plus de notifications ni de mise en avant, mais reste conservé et
réactivable (aucune perte de l'intérêt exprimé).

## RG-FOL-07 — Statistiques anonymisées

Les suivis peuvent alimenter des statistiques d'intérêt de la communauté ; à des fins analytiques, ces
statistiques sont **anonymisées** (RG-PREF-07 / confidentialité).

---

# Utilisations (ADR.19)

- **Recommandations** : proposer des événements liés aux objets suivis (FSPEC Discovery/Reco).
- **Notifications** : informer des nouveautés des objets suivis (FSPEC.04).
- **Recherche** : mettre en avant les contenus correspondant aux centres d'intérêt.
- **Tableau de bord** : afficher les organisations / lieux / activités suivis.
- **Analytique** : mesurer les tendances (anonymisé).

---

# Parcours

- **Suivre / ne plus suivre** : depuis une fiche (organisateur, lieu, activité…) → bouton « Suivre » →
  Follow créé → réversible.
- **Gérer ses suivis** : depuis le tableau de bord / menu profil → liste des suivis → suspendre /
  réactiver / supprimer, régler « notifications activées » par suivi.

(Détail des écrans : UISPEC.06 Follow.)

---

# Correspondance avec la V2

- **Nouveau domaine** : le Follow **n'existe pas** en V2 (hors V1, chantier §6). Il est **prérequis** de
  la famille « information Explorer » des notifications et des recommandations à base de suivis.
- Ne pas confondre avec `UserParticipation` (V2) — participation à un **événement** — ni avec
  `Organizer` (fiche catalogue) ou `Organization` (tenant), qui sont des **objets suivables**.

---

# Hors périmètre (V3)

- Niveaux de suivi multiples, abonnements temporaires, recommandations collaboratives, communautés
  d'intérêt (préparés par le modèle — ADR.19 — non implémentés ; Backlog V4).

---

# Documents liés

99-ADR.19-FollowDomainModel · 99-ADR.17/20 · 03-TSPEC.06-Follow-v3.0 · 04-UISPEC.06-Follow-v3.0 ·
02-FSPEC.04-Notification-v3.0 · 02-FSPEC.05-Preferences-v3.0 · 01-ARCHI.03-Catalog-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle du domaine Follow (entité indépendante, objets suivables, cycle de vie, usages). |
