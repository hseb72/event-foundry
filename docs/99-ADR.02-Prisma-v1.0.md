# ADR.02 — Prisma ORM

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

Le Backend nécessite un ORM moderne, fortement typé et compatible avec PostgreSQL.

---

# Décision

Prisma est l'unique ORM du projet.

Toutes les opérations de persistance transitent exclusivement par des Repositories.

Prisma Client n'est jamais utilisé directement par les Services.

---

# Alternatives considérées

- TypeORM
- Sequelize
- SQL natif

Toutes rejetées.

---

# Conséquences

Avantages :

- typage fort ;
- migrations intégrées ;
- simplicité ;
- excellente intégration TypeScript.

Inconvénients :

- dépendance à Prisma ;
- apprentissage spécifique.

---

# Documents impactés

- TSPEC.01
- TSPEC.02