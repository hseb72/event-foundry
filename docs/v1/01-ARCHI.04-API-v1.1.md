# REST API

**Document** : ARCHI.04
**Fichier** : 01-ARCHI.04-API-v1.1.md
**Version** : 1.1
**Statut** : Validé

---

# Historique des modifications

Version 1.1

- suppression du Domain des données saisies ;
- ajout de la provenance des Events ;
- précision sur les scores de confiance des EventCandidate ;
- enrichissement des informations retournées sur les Imports ;
- gestion des référentiels actifs.

---

# Création / modification d'un Event

Le Domain n'est jamais fourni par le client.

L'utilisateur choisit uniquement :

- Activity
- EventType
- EventFormat (optionnel)
- Organizer
- Venue

Le backend déduit automatiquement le Domain associé à l'Activity.

Toute tentative d'envoyer un Domain est ignorée ou rejetée selon le contexte.

---

# ImportResponse

```json
{
    "id": "...",
    "status": "READY_FOR_VALIDATION",
    "startedAt": "...",
    "finishedAt": "...",
    "candidateCount": 3
}
```

Ces informations permettent au frontend de suivre précisément le traitement d'un import.

---

# EventCandidateResponse

```json
{
    "id": "...",

    "status": "PENDING",

    "payload": {

    },

    "confidence": {

        "title": 0.98,

        "startsAt": 1.00,

        "venue": 0.76,

        "organizer": 0.43

    }
}
```

Le champ `confidence` contient un score **par information détectée**.

Aucun score global n'est calculé par l'API.

Le frontend est libre de calculer une synthèse visuelle.

---

# EventResponse

```json
{
    "id": "...",

    "source": "IMPORT",

    "title": "...",

    "activity": "...",

    "eventType": "...",

    "eventFormat": "...",

    "organizer": "...",

    "venue": "...",

    "startsAt": "...",

    "endsAt": "..."
}
```

Valeurs possibles de `source` :

- IMPORT
- MANUAL

Cette information est informative et ne peut pas être modifiée par le client.

---

# Référentiels

Par défaut, toutes les collections ne retournent que les valeurs actives.

Exemple :

```
GET /api/v1/activities
```

↓

Retourne uniquement :

```
is_active = true
```

Pour les interfaces d'administration :

```
GET /api/v1/activities?includeInactive=true
```

retourne l'ensemble des valeurs.

---

# Validation métier

Lors de la création ou de la modification d'un Event :

- l'Activity est obligatoire ;
- le Domain est automatiquement déduit ;
- le EventType doit appartenir à l'Activity ;
- le EventFormat, s'il est renseigné, doit appartenir à cette même Activity.

Ces contrôles sont réalisés par le backend.

---

# Compatibilité

Cette version est rétrocompatible avec l'architecture v1.0.

Elle apporte uniquement des précisions contractuelles et enrichit les DTO.

---

# Historique

| Version | Description |
|----------|-------------|
| 1.0 | Première version validée. |
| 1.1 | Domain déduit de l'Activity, ajout de `source`, enrichissement des DTO Import et EventCandidate, prise en charge des référentiels inactifs. |