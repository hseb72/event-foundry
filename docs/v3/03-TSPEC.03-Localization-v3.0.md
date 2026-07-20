# Localisation — Spécification technique

**Document** : TSPEC.03

**Fichier** : 03-TSPEC.03-Localization-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique de la localisation V3 : résolution déterministe **pays + code postal
→ commune(s)**, indexation du code postal, région dérivée, et intégration aux adresses d'organisation
(TSPEC.02) et à la recherche. Prolonge le référentiel géographique V2 sans le renier.

---

# Position & module

Domaine `reference-data` (géographie), Prisma confiné aux Repositories (ADR.02). Exposé aux autres
modules (organization, events, search, import) via une interface de service
`LocalizationService` (`resolveByPostalCode`, `getRegionForMunicipality`), jamais via les entités.

---

# Modèle de données

Référentiel V2 conservé (**option A** retenue en FSPEC.03 : `Region` reste un niveau de hiérarchie,
seulement masqué à la sélection).

```prisma
model Country {
  id        String   @id @default(uuid())
  code      String   @unique               // ISO 3166-1 alpha-2
  name      String
  regions   Region[]
  @@map("countries")
}

model Region {
  id         String  @id @default(uuid())
  countryId  String  @map("country_id")
  code       String?
  name       String
  municipalities Municipality[]
  @@index([countryId])
  @@map("regions")
}

model Municipality {
  id          String  @id @default(uuid())
  regionId    String  @map("region_id")
  name        String
  postalCode  String  @map("postal_code")
  latitude    Float?
  longitude   Float?
  @@index([postalCode])                    // NOUVEAU (V3) : recherche par code postal
  @@index([regionId])
  @@map("municipalities")
}
```

- **Nouveauté V3** : index sur `municipalities.postal_code` (RG-LOC-04) — absent en V2.
- **Région dérivée** : obtenue via `Municipality.region` ; jamais stockée ailleurs (RG-LOC-02).
- Un même `postalCode` peut correspondre à **plusieurs** communes (RG-LOC-03) → la résolution renvoie
  une **liste**.

> **[à trancher — si option B]** rétrograder `Region` en attribut `Municipality.regionName` supposerait
> une migration de données et la réécriture des rapprochements. Non retenu par défaut.

---

# Résolution & recherche

```ts
interface LocalizationService {
  resolveByPostalCode(countryCode: string, postalCode: string): Promise<Municipality[]>;
  getRegionForMunicipality(municipalityId: string): Promise<Region>;
}
```

- **Résolution** : requête indexée `(countryCode via region.country, postalCode)`. Renvoie 0..n
  communes ; 0 → message « introuvable » ; n>1 → désambiguïsation côté UI (RG-LOC-03).
- **Recherche d'événements** : le filtre de proximité passe de « région/ville » à **pays + code postal**
  → ensemble de `municipalityId` → filtre sur `Event.municipalityId` (module `search`). Aucune
  dépendance à la région dans le filtre (dérivée uniquement).

---

# Intégration

- **Adresses d'organisation** (TSPEC.02) : `OrganizationAddress` porte `countryCode` + `postalCode` +
  `municipalityId` (résolu). Région affichée via `getRegionForMunicipality`.
- **Création manuelle d'événement** : le formulaire propose les adresses de l'organisation active
  (RG-LOC-05) ou une saisie pays + code postal.
- **Normalisation à l'import** (FSPEC.01) : la phase *Normalize* appelle `resolveByPostalCode` ; si
  l'ambiguïté n'est pas résoluble, la localisation reste **à valider** (EventCandidate) — aucune
  décision métier automatique.

---

# Migration

- Migration Prisma additive : **ajout de l'index** `postal_code` ; aucune donnée détruite.
- Les données géographiques existantes (V2) sont conservées ; `seed.ts` reste la source du référentiel
  (aucune donnée fonctionnelle).
- Les formulaires migrent de la cascade 3 sélecteurs vers **pays + code postal** (impact Frontend,
  UISPEC.03) — le contrat de stockage (`municipalityId`) est inchangé.

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| Cascade pays / région / ville | Pays + code postal + désambiguïsation |
| `postalCode` non indexé | `postalCode` **indexé** |
| Région sélectionnée | Région **dérivée** (lecture seule) |
| `Event.municipalityId` | inchangé |

---

# Contraintes

- Résolution déterministe (référentiel, jamais d'IA) ; commune = unité de stockage ; région dérivée ;
  Prisma confiné aux Repositories ; dépendance à `LocalizationService` (abstraction). Migration additive
  uniquement (aucune migration appliquée modifiée). Toute exception = nouvel ADR.

---

# Documents liés

02-FSPEC.03-Localization-v3.0 · 04-UISPEC.03-Localization-v3.0 · 03-TSPEC.02-Organization-v3.0 ·
02-FSPEC.01-Import-v3.0 · 01-ARCHI.03-Catalog-v3.0 · (V2) référentiel géographique

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de la localisation par pays + code postal (index, région dérivée, intégration adresses/import/recherche). |
