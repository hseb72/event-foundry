# Recherche des Events

**Document** : FSPEC.04
**Fichier** : 02-FSPEC.04-Search-v0.2.md
**Version** : 0.2
**Statut** : Draft

---

# Historique des modifications

Version 0.2

- suppression du filtre Domain ;
- ajout des filtres rapides temporels ;
- ajout du filtre "Mes événements" ;
- prise en compte des référentiels actifs ;
- affichage optionnel de la qualité des données.

---

# Objectif

Permettre à un utilisateur de découvrir rapidement les événements correspondant à ses centres d'intérêt et de les ajouter à son calendrier personnel.

La recherche constitue le point d'entrée principal vers les événements disponibles dans la plateforme.

---

# Périmètre

Cette spécification couvre :

- la recherche d'événements ;
- les filtres ;
- les tris ;
- la consultation d'un Event ;
- l'ajout d'une participation.

---

# Acteurs

## Utilisateur

Recherche des événements.

Consulte leurs détails.

Décide de participer.

---

# Workflow

```
Recherche

↓

Application des filtres

↓

Consultation

↓

Participation éventuelle

↓

Mise à jour du calendrier
```

---

# Filtres

Les filtres peuvent être utilisés simultanément.

## Date

- Aujourd'hui
- Cette semaine
- Ce mois
- 7 prochains jours
- 30 prochains jours
- Période personnalisée

---

## Activity

Liste des Activities actives.

---

## EventType

Filtré automatiquement selon l'Activity sélectionnée.

---

## EventFormat

Filtré automatiquement selon l'Activity sélectionnée.

---

## Organizer

---

## Venue

---

## Ville

---

## Texte libre

Recherche dans :

- titre
- description

---

## Participation

- Tous les événements
- Mes événements uniquement
- Événements sans participation

---

# Résultats

Chaque résultat affiche :

- titre
- date
- heure
- Activity
- EventType
- Organizer
- Venue
- ville

Si une participation existe, son état est immédiatement visible.

---

# Qualité des données

Pour les Events issus d'un import, la plateforme peut afficher un indicateur global de qualité.

Exemples :

🟢 Haute confiance

🟡 Confiance moyenne

🔴 Vérification conseillée

Cette représentation est calculée à partir des scores de confiance présents sur l'EventCandidate d'origine.

Le mode d'affichage sera défini dans une TSPEC UI.

---

# Règles métier

RM-001

Le Domain n'est jamais utilisé comme filtre.

Il est entièrement déduit de l'Activity.

---

RM-002

Les EventCandidate ne sont jamais affichés.

---

RM-003

Les Events supprimés logiquement ne sont jamais retournés.

---

RM-004

Les référentiels inactifs ne sont jamais proposés dans les filtres.

---

RM-005

Les filtres sont cumulables.

---

RM-006

La recherche est paginée.

---

RM-007

Le changement d'un filtre relance automatiquement la recherche.

---

# API concernées

GET /api/v1/events

GET /api/v1/events/{id}

PUT /api/v1/events/{id}/participation

---

# Critères d'acceptation

CA-001

Tous les filtres sont combinables.

---

CA-002

Le filtre "Mes événements" ne retourne que les événements possédant une participation.

---

CA-003

Les filtres temporels rapides fonctionnent.

---

CA-004

Les EventCandidate n'apparaissent jamais.

---

CA-005

Le Domain n'est jamais proposé comme critère.

---

CA-006

Les référentiels inactifs n'apparaissent plus.

---

# Tests fonctionnels

TF-001

Recherche sans filtre.

Tous les événements futurs sont affichés.

---

TF-002

Filtre "Mes événements".

Seuls les événements possédant une participation sont retournés.

---

TF-003

Filtre "7 prochains jours".

Les résultats sont limités à cette période.

---

TF-004

Sélection d'une Activity.

Les EventType et EventFormat sont automatiquement filtrés.

---

TF-005

Ouverture d'un Event.

Toutes les informations sont affichées.

---

# Documents liés

- VISION
- ARCHI.02
- ARCHI.03
- ARCHI.04
- FSPEC.03
- FSPEC.05
- FSPEC.06

---

# Historique

| Version | Description |
|----------|-------------|
| 0.1 | Première rédaction. |
| 0.2 | Suppression du Domain, ajout des filtres rapides, filtre "Mes événements", qualité des données et référentiels actifs. |