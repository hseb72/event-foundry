# AI Services

**Document** : FSPEC.22

**Fichier** : 02-FSPEC.22-AIServices-v3.0.md

**Version** : 3.0

**Statut** : Validé

---

# 1. Objectif

Cette spécification décrit les services d'Intelligence Artificielle mis à disposition des différents modules d'EventFoundry.

L'objectif est de fournir un ensemble cohérent de services fonctionnels réutilisables, indépendamment des fournisseurs d'IA utilisés.

Les choix technologiques (OpenAI, Anthropic, Ollama, Azure OpenAI, etc.) sont définis dans les ADR et les TSPEC.

---

# 2. Principes généraux

L'IA est considérée comme un ensemble de services transverses.

Les services IA ne remplacent jamais les règles métier.

Ils les complètent en automatisant des tâches à faible valeur ajoutée ou nécessitant des capacités cognitives.

Les résultats produits par l'IA peuvent être :

- appliqués automatiquement ;
- proposés à validation ;
- rejetés.

Le niveau d'automatisation dépend du niveau de confiance obtenu.

---

# 3. Architecture fonctionnelle

Les services IA sont accessibles depuis l'ensemble de la plateforme.

Ils sont utilisés notamment par :

- Explorer ;
- Organizer ;
- Operator ;
- processus internes ;
- traitements planifiés.

Chaque service expose une interface fonctionnelle commune.

---

# 4. Catalogue des services

Le catalogue initial comprend les services suivants.

| Service | Description |
|----------|-------------|
| OCR | Extraction de texte depuis une image |
| Information Extraction | Extraction d'informations structurées |
| Classification | Classification automatique |
| Translation | Traduction multilingue |
| Content Enrichment | Enrichissement des données |
| Moderation | Analyse des contenus |
| Duplicate Detection | Détection de doublons |
| Recommendation | Suggestions pertinentes |
| Semantic Search | Recherche sémantique |
| Conversational Assistant | Assistance utilisateur |

De nouveaux services peuvent être ajoutés sans modifier l'architecture.

---

# 5. OCR

Le service OCR extrait le texte présent dans une image.

Entrées possibles :

- affiche ;
- flyer ;
- capture d'écran ;
- photographie.

Sorties :

- texte brut ;
- zones détectées ;
- score de confiance.

---

# 6. Information Extraction

Ce service transforme un contenu non structuré en données exploitables.

Exemples :

- nom de l'événement ;
- dates ;
- horaires ;
- lieu ;
- activité ;
- organisateur ;
- URL ;
- tarif.

Le résultat est un objet structuré conforme au modèle métier.

---

# 7. Classification

Le système peut classifier automatiquement :

- activités ;
- formats ;
- catégories ;
- langues ;
- niveaux de confiance.

Les propositions peuvent être validées automatiquement ou soumises à un Operator.

---

# 8. Traduction

Les contenus peuvent être traduits automatiquement.

La traduction peut concerner :

- descriptions ;
- règles ;
- informations publiques.

Le texte d'origine est toujours conservé.

---

# 9. Enrichissement

Le service peut compléter des informations incomplètes.

Exemples :

- coordonnées GPS ;
- informations publiques ;
- site web ;
- ville ;
- pays.

Toutes les informations enrichies sont identifiées comme telles.

---

# 10. Modération assistée

Le service IA peut assister les Operators.

Exemples :

- contenu offensant ;
- spam ;
- fraude ;
- doublons ;
- images inappropriées.

La décision finale appartient toujours à un Operator lorsque la confiance est insuffisante.

---

# 11. Détection de doublons

Le système peut détecter automatiquement :

- événements similaires ;
- organisations similaires ;
- lieux identiques ;
- images identiques.

Les doublons détectés peuvent être proposés à validation.

---

# 12. Recommandation

Le système peut produire des recommandations personnalisées.

Les recommandations peuvent prendre en compte :

- activités suivies ;
- historique ;
- proximité ;
- organisateurs suivis ;
- événements similaires.

Les règles de recommandation restent explicables.

---

# 13. Recherche sémantique

La recherche peut utiliser des représentations sémantiques.

Elle permet notamment :

- la recherche par intention ;
- les synonymes ;
- les formulations naturelles.

La recherche classique reste toujours disponible.

---

# 14. Assistant conversationnel

Un assistant peut guider les utilisateurs.

Exemples :

- recherche d'événements ;
- aide à la création d'un événement ;
- aide à la configuration ;
- assistance aux Operators.

L'assistant ne réalise aucune action sans validation explicite lorsque celle-ci a un impact métier.

---

# 15. Niveau de confiance

Chaque résultat IA possède un niveau de confiance.

Exemples :

- Very Low
- Low
- Medium
- High
- Very High

Le niveau de confiance influence les traitements automatiques.

---

# 16. Validation humaine

Selon le contexte métier, une validation humaine peut être requise.

Exemples :

- publication ;
- modération ;
- suppression ;
- fusion ;
- correction de données.

Les règles de validation sont configurables.

---

# 17. Traçabilité

Toute utilisation d'un service IA est historisée.

Sont notamment enregistrés :

- service utilisé ;
- date ;
- utilisateur ou processus ;
- niveau de confiance ;
- résultat produit ;
- décision finale.

---

# 18. Gestion des erreurs

En cas d'échec d'un service IA :

- le traitement est interrompu ou dégradé ;
- une erreur est journalisée ;
- une reprise manuelle peut être proposée.

La plateforme continue de fonctionner sans dépendance critique à un fournisseur IA.

---

# 19. Configuration

Les paramètres suivants sont configurables :

- activation d'un service ;
- seuils de confiance ;
- validation obligatoire ;
- quotas ;
- politiques de conservation ;
- règles de routage.

Les détails techniques sont définis dans les ADR et TSPEC.

---

# 20. Règles de gestion

| Identifiant | Règle |
|--------------|--------|
| AI-001 | Les services IA sont indépendants des fournisseurs. |
| AI-002 | Chaque service possède une responsabilité unique. |
| AI-003 | Tous les résultats IA possèdent un niveau de confiance. |
| AI-004 | Les traitements automatiques respectent les seuils configurés. |
| AI-005 | Les résultats IA peuvent être validés par un humain. |
| AI-006 | Les traitements IA sont historisés. |
| AI-007 | La plateforme reste opérationnelle en cas d'indisponibilité d'un fournisseur IA. |
| AI-008 | Les règles métier prévalent toujours sur les décisions proposées par l'IA. |
| AI-009 | Les données enrichies par IA sont identifiables. |
| AI-010 | Les nouveaux services IA peuvent être ajoutés sans modifier le modèle fonctionnel. |

---

# 21. Critères d'acceptation

## AC-AI-001

Les modules de la plateforme peuvent consommer un service IA sans connaître son fournisseur.

---

## AC-AI-002

Chaque résultat IA possède un niveau de confiance.

---

## AC-AI-003

Les traitements soumis à validation humaine peuvent être acceptés ou rejetés.

---

## AC-AI-004

Les traitements IA sont historisés.

---

## AC-AI-005

La plateforme continue de fonctionner lorsqu'un service IA devient indisponible.

---

## AC-AI-006

Les services IA peuvent être activés ou désactivés individuellement.

---

## AC-AI-007

Les règles métier priment toujours sur les recommandations IA.

---

## AC-AI-008

De nouveaux services IA peuvent être ajoutés sans modifier les consommateurs existants.

---

# 22. Documents associés

- ADR – Artificial Intelligence
- ADR – External Providers
- ADR – Security
- FSPEC.20 – Platform Moderation
- FSPEC.21 – Case Management
- TSPEC – AI Connectors *(à venir)*