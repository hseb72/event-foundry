# @event-foundry/classifier-worker

Moteur expert : consomme `CLASSIFICATION_QUEUE` (`OCRResult`), applique une chaîne de
`ClassificationRule` **déterministes**, produit un `ClassificationResult` publié sur
`RESULT_QUEUE`. **Aucune IA générative, aucune persistance, aucun accès PostgreSQL**
(TSPEC.05, ADR.06, ADR.07).

## Chaîne de règles (ordonnée, réordonnable — ADR.06)

`TitleRule → DateRule → TimeRule → ActivityRule → EventTypeRule → SubjectRule →
ActivityFromSubjectRule → ModalityRule → OrganizerRule → VenueRule → PriceRule → UrlRule →
CapacityRule`

Chaque règle est indépendante, ne connaît pas les autres, calcule son propre **score de
confiance par champ** (aucun score global) et peut émettre des **diagnostics** (ambiguïté,
info). Le moteur (`RulePipelineEngine`) orchestre seulement l'exécution ; une règle en
échec n'interrompt pas les autres.

## Taxonomie DATA.01 v2.0 : l'affiche nomme le **sujet**, pas l'activité

Depuis la taxonomie v2.0, les activités sont **généralistes** (Jeux, Musique, Sport, Cinéma…) et
n'apparaissent quasiment jamais telles quelles sur un document. Ce qu'une affiche nomme, c'est le
**sujet** : « Magic », « Rock », « Football ». `ActivityFromSubjectRule` remonte donc
`Subject → Family → Activity` lorsque l'activité n'a pas été reconnue littéralement — sans quoi
l'activité, pourtant **obligatoire** sur un Event, restait vide alors que la hiérarchie du
référentiel permettait de la déterminer. La déduction est strictement référentielle (aucune
correspondance inventée) et n'écrase jamais une activité littéralement présente dans le texte ;
sa confiance est volontairement plus basse (0,75 contre 0,85 / 0,95).

## Reconnaissance des libellés (`containsWord`)

La correspondance reste **exacte au mot près** — aucune approximation orthographique, aucune racine
tronquée : une décision métier ne peut pas reposer sur une ressemblance. Elle tolère en revanche ce
que produisent réellement les affiches et l'OCR :

| Variation | Exemple |
|-----------|---------|
| retour à la ligne dans un libellé composé | « Jeu de\nplateau » → *Jeu de plateau* |
| pluriel (s/x), sur chaque mot | « tournois », « jeux de plateau » |
| ponctuation libre entre les mots | « Yu Gi Oh » → *Yu-Gi-Oh!*, « rap hip hop » → *Rap/Hip-hop* |
| absence d'accents | « Pokemon » → *Pokémon* |

Restent **refusés** : un fragment de mot (« Magicien » n'est pas *Magic*), l'absence de séparateur
(« hiphop » n'est pas *Hip-hop*) et l'inversion des mots.

## Alias : ce qu'une affiche écrit vraiment

Les cinq référentiels reconnus dans le texte — Activity, EventType, Subject, Organizer, Venue —
portent des **alias**. Une affiche écrit « MTG », « D&D », « LoL », « BD », un sigle d'association,
rarement le nom complet du référentiel. Chaque règle reconnaît donc `nom OU alias`, avec une
**confiance moindre pour un alias** : une abréviation est plus ambiguë qu'un nom explicite. Quand un
texte cite les deux (« Magic (MTG) »), la référence ne remonte qu'une fois et le nom prime.

Les alias sont chargés en **un seul appel** (`GET /aliases`) : un chargement par entrée aurait
multiplié les requêtes par la taille du référentiel.

## Référentiels (jamais codés en dur)

Les règles travaillent sur un `ReferenceSnapshot` (activités + alias, types, **familles**, sujets,
modalités, organisateurs, lieux) fourni par `ReferenceDataProvider`. L'implémentation V1
(`HttpReferenceDataProvider`) charge ces données via l'**API REST du Backend** avec cache
+ TTL, et **dégradation gracieuse** si le Backend est indisponible (les règles texte —
date, heure, prix, URL — continuent de fonctionner). Le `Domain` n'est jamais recherché :
il est déduit de l'`Activity` par le Backend.

## Limites connues (V1)

- Heuristiques d'extraction volontairement simples (dates FR, heures, prix €, URL) — à
  enrichir. `TitleRule` prend la première ligne significative.
- `CapacityRule` produit un diagnostic (la capacité n'est pas un champ d'Event en V1).
- Les libellés extraits mais non résolus restent proposables à la modération depuis le formulaire de
  qualification (Case `REFERENCE_SUGGESTION`), qui peut les accepter comme nouvelle référence **ou**
  comme alias d'une référence existante.

## Démarrage

```bash
npm run infra:up            # Redis
npm run start:dev --workspace @event-foundry/classifier-worker
```

Variables : `REDIS_HOST/PORT`, `CLASSIFIER_BACKEND_URL`, `CLASSIFIER_SERVICE_EMAIL/PASSWORD`,
`REFERENCE_TTL_MS`, `CLASSIFIER_CONCURRENCY`.
