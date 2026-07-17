# ADR.06 — Rule Engine Architecture

**Statut** : Accepted

**Version** : 1.0

---

# Contexte

Le moteur expert doit évoluer continuellement avec l'ajout de nouvelles règles métier.

Une architecture fortement couplée rendrait ces évolutions coûteuses et risquées.

---

# Décision

Le moteur expert est constitué d'une chaîne de règles indépendantes.

Chaque règle implémente une interface commune :

```typescript
export interface ClassificationRule {
    execute(context: ClassificationContext): Promise<void>;
}
```

Le moteur orchestre uniquement l'exécution des règles.

Les règles :

- possèdent une responsabilité unique ;
- ne se connaissent pas ;
- sont configurables ;
- peuvent être activées ou désactivées ;
- peuvent être réordonnées sans modifier le moteur.

---

# Alternatives considérées

Moteur central contenant toute la logique.

Rejeté.

Le couplage est trop important et limite fortement l'évolutivité.

---

# Conséquences

Avantages :

- ajout de nouvelles règles sans modifier le moteur ;
- tests unitaires simples ;
- forte extensibilité ;
- spécialisation possible par domaine ;
- excellente maintenabilité.

Inconvénients :

- orchestration légèrement plus complexe ;
- nécessité de définir un ordre d'exécution cohérent.

---

# Documents impactés

- TSPEC.03
- TSPEC.05
- TSPEC.06
- TSPEC.07