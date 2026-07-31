# ADR.04 — Single Technology per Responsibility

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

L'utilisation de plusieurs technologies pour une même responsabilité augmente la complexité, la maintenance et le coût d'évolution.

---

# Décision

Chaque responsabilité technique est assurée par une unique technologie de référence.

| Responsabilité | Technologie |
|----------------|-------------|
| API | NestJS |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Queue | BullMQ |
| Cache | Redis |
| Stockage objet | MinIO |
| OCR | Tesseract |
| Traitement d'image | OpenCV |
| Frontend | Angular |

Toute exception nécessite une nouvelle ADR.

> **Note (2026-07) — prétraitement OCR : `sharp` à l'essai.** Le prétraitement d'image de
> l'OCR Worker est implémenté avec **`sharp`** (libvips) dans un premier temps, et non
> OpenCV : `sharp` couvre l'essentiel (niveaux de gris, upscaling, contraste, débruitage,
> binarisation) sans dépendance native lourde, et a permis d'obtenir un OCR fonctionnel sur
> affiches (voir `ocr-worker/eval`). C'est une **dérogation temporaire** à la ligne
> « Traitement d'image | OpenCV » ci-dessus, à confirmer ou infirmer par une ADR dédiée si le
> deskew avancé / l'analyse de composantes deviennent nécessaires (là où OpenCV s'impose).

---

# Alternatives considérées

Choix multiples selon les besoins.

Rejeté.

La flexibilité ne compense pas le coût de maintenance.

---

# Conséquences

Avantages :

- homogénéité ;
- expertise concentrée ;
- maintenance simplifiée.

Inconvénients :

- remplacement d'une technologie plus structurant.

---

# Documents impactés

- TSPEC.01
- TSPEC.02
- TSPEC.04
- TSPEC.07