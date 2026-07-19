# Database Model

**Document** : ARCHI.03
**Fichier** : 01-ARCHI.03-Database-v1.2.md
**Version** : 1.2
**Statut** : Validé

---

# Historique des modifications

Version 1.2

- conservation des métadonnées de l'OCRResult source sur l'ImportJob
  (`ocr_confidence`, `ocr_language`, `ocr_engine`, `ocr_engine_version`,
  `ocr_page_count`, `ocr_processing_time_ms`), en complément de `ocr_text` ;
- ajout de la table `import_job_events` (journal des transitions d'état d'un
  ImportJob) pour les statistiques sur les passages entre états.

Version 1.1

- ajout de la provenance d'un Event (`source`) ;
- ajout des dates de début et fin de traitement d'un ImportJob ;
- ajout des informations de correction d'un EventCandidate ;
- clarification du stockage des scores de confiance ;
- ajout du statut d'activation des référentiels ;
- clarification des relations Organizer / Venue.

---

# Référentiels

Toutes les tables de référentiel possèdent désormais :

| Colonne | Type |
|----------|------|
| is_active | boolean |

Une valeur inactive :

- n'est plus proposée dans les listes de saisie ;
- reste valide pour l'historique des Events existants.

---

# Organizers

Colonnes

- id
- name
- website
- is_active
- created_at
- updated_at

Un Organizer représente uniquement l'organisateur d'un événement.

Il peut être :

- une boutique ;
- une association ;
- une entreprise ;
- une fédération ;
- une personne physique.

Il n'est pas lié obligatoirement à un Venue.

---

# Venues

Colonnes

- id
- organizer_id (nullable)
- name
- address
- postal_code
- city
- latitude
- longitude
- is_active
- created_at
- updated_at

Le lien Organizer → Venue est optionnel.

Un même Organizer peut organiser des événements dans plusieurs lieux.

Un même Venue peut accueillir des événements organisés par plusieurs Organizer.

---

# ImportJobs

Colonnes

- id
- attachment_id
- status
- ocr_text
- ocr_confidence
- ocr_language
- ocr_engine
- ocr_engine_version
- ocr_page_count
- ocr_processing_time_ms
- started_at
- finished_at
- created_at
- updated_at

started_at correspond au démarrage réel du traitement.

finished_at correspond à la fin complète du pipeline.

Les colonnes `ocr_*` conservent l'OCRResult source (texte et métadonnées du moteur OCR).
Elles restent nulles tant que l'OCR n'a pas abouti et sont renseignées par le Backend à la
réception du `ClassificationResult` (les Workers n'accèdent jamais à PostgreSQL). Elles
assurent la traçabilité, la rejouabilité et la comparaison des versions du moteur OCR.

Ces informations permettent le calcul :

- durée OCR ;
- durée Classification ;
- durée totale d'un import.

---

# ImportJobEvents

Journal des transitions d'état d'un ImportJob : une ligne est ajoutée à **chaque** passage
d'état. Le Backend orchestrant chaque étape du pipeline, il est le seul à écrire ce journal.

Colonnes

- id
- import_job_id
- status
- correlation_id
- occurred_at

Cette table est une sous-entité d'audit de l'ImportJob (suppression en cascade avec lui).
Elle permet les statistiques sur les passages entre états (comptages, taux d'échec,
durées par étape) sans se limiter à l'état courant de l'ImportJob.

---

# EventCandidate

Colonnes

- id
- import_job_id
- status
- payload (JSONB)
- confidence (JSONB)
- corrected_by
- corrected_at
- created_at
- updated_at

Le champ confidence contient un score par information détectée.

Exemple :

```json
{
  "title":0.98,
  "startsAt":1.0,
  "venue":0.76,
  "organizer":0.41
}
```

Le payload représente toujours un brouillon d'Event.

---

# Events

Colonnes

- id
- source
- activity_id
- event_type_id
- event_format_id
- organizer_id
- venue_id
- title
- description
- starts_at
- ends_at
- price
- currency
- created_at
- updated_at

Le champ source indique la provenance métier de l'événement.

Valeurs V1 :

- IMPORT
- MANUAL

Cette information est destinée à l'audit et aux statistiques.

---

# Contraintes supplémentaires

Les référentiels inactifs restent référencés par les Events historiques.

Un EventCandidate validé ou rejeté conserve définitivement :

- son payload ;
- ses scores de confiance ;
- les informations de correction éventuelles.

---

# Historique

| Version | Description |
|----------|-------------|
|1.0|Première version validée.|
|1.1|Ajout de la provenance des Events, enrichissement des ImportJob, historisation des corrections des EventCandidate, activation des référentiels et clarification Organizer/Venue.|