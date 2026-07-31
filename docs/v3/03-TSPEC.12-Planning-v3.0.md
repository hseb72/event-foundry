# Présentation du planning — Spécification technique

**Document** : TSPEC.12

**Fichier** : 03-TSPEC.12-Planning-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique de la présentation du planning : **URL de vignette** de couverture en
liste, endpoints d'accueil (À venir / À découvrir) en trois sections disjointes, et **vues calendrier**
(jour/semaine/mois) avec accès au passé. Prolonge l'existant V2 (participation, endpoint calendrier,
médias MinIO) sans le renier.

---

# Position

- **Backend** : modules `calendar` / `events` / `discovery` (V2) enrichis d'un **service de vignette**
  et d'endpoints d'accueil sectionnés. Prisma confiné aux Repositories.
- **Frontend** : composants de carte (couverture), d'accueil (blocs + sections) et de calendrier
  (jour/semaine/mois).

---

# Vignette de couverture

- **Problème V2** : les endpoints de **liste** renvoient `media: []` (les médias ne sont chargés qu'au
  détail).
- **Cible** : exposer une **URL de vignette** légère par événement en liste.

```ts
interface EventListItem {
  id; title; startsAt; // …
  coverThumbnailUrl: string | null; // 1ʳᵉ image, format vignette (null → repli visuel)
}
```

- **Génération** : à l'ajout d'un média, produire une **vignette** (redimensionnée) stockée dans MinIO ;
  l'URL est **mise en cache** (CDN / cache HTTP) — jamais le média plein format en liste (RG-PLN-01).
- **Repli** : `null` → le Frontend applique un visuel de repli (couleur d'univers/activité).

---

# Endpoints d'accueil (sections disjointes)

```
GET /home/upcoming    → { today[], thisWeek[], thisMonth[] }   // qualifiés (participation)
GET /home/discover    → { today[], thisWeek[], thisMonth[] }   // non qualifiés + recommandés
```

- **Bornes disjointes** (RG-PLN-04), calculées dans le **fuseau utilisateur** (RG-PLN-07) :
  - `today` = jour courant ;
  - `thisWeek` = du lendemain à la fin de la semaine ;
  - `thisMonth` = de la semaine suivante à la fin du mois.
- **upcoming** : filtre `EXISTS UserParticipation(user, event)` (qualifié — V2), `startsAt ≥ maintenant`.
- **discover** : moteur de **recommandation déterministe**, exclut les événements déjà qualifiés
  (RG-PLN-03).

---

# Vues calendrier

```
GET /calendar?view=day|week|month&anchor=<date>&includePast=true|false
```

- **day** : événements du jour, ordonnés par heure (résolution horaire).
- **week** : 7 jours, regroupés par jour.
- **month** : grille mensuelle (jours × événements).
- **Passé** : `includePast=true` autorisé **uniquement** pour Mon planning (RG-PLN-05) ; l'endpoint
  calendrier V2 renvoie déjà le passé sans borne — réutilisé.
- Contenu = événements **qualifiés** (participation), comme « À venir ».

**Index** : s'appuie sur les index V2 `Events(starts_at, …)` et `UserParticipation(user_id, event_id)`.

---

# Interactions

- Réutilisent `PUT /events/:id/participation` (V2). Remettre tous les axes à neutre
  (`interested=false`, `reservationStatus=NONE`, `paymentStatus=NONE`) **supprime** la participation →
  l'événement quitte le planning (mais reste en recherche) — RG-PLN-06 / FSPEC.06 V2.

---

# Fuseau horaire

- Stockage **UTC** (`timestamptz` — TSPEC.02 V2) ; conversion vers le **fuseau utilisateur**
  (préférence — TSPEC.05) au calcul des sections et à l'affichage calendrier (RG-PLN-07).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Listes `media: []` | `coverThumbnailUrl` en liste (vignette MinIO/CDN) |
| Endpoint calendrier (passé sans borne) | réutilisé ; paramètre `view` jour/semaine/mois |
| Participation = qualification | inchangé (filtre « À venir » / Mon planning) |
| Reco déterministe | branchée sur « À découvrir » |

---

# Contraintes

- Vignette légère en liste (jamais le média plein) ; sections disjointes en fuseau utilisateur ; passé
  réservé à Mon planning ; interactions via participation (V2) ; stockage UTC ; Prisma confiné aux
  Repositories. Toute exception = nouvel ADR.

---

# Documents liés

03-TSPEC.12 · 02-FSPEC.12-Planning-v3.0 · 04-UISPEC.12-Planning-v3.0 · (V2) modules calendar/events/
discovery, `UserParticipation`, MinIO · 03-TSPEC.05-Preferences-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de la présentation du planning (vignette de couverture, endpoints d'accueil sectionnés, vues calendrier). |
