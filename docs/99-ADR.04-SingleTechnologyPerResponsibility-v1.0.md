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