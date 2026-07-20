# Roadmap de développement — V3

**Document** : RMAP.00

**Fichier** : 05-RMAP.00-DevelopmentRoadmap-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Découper la V3 en EPICs — capacités développables, testables et validables indépendamment. Chaque
EPIC référence ses décisions (ADR) et alimentera ses FSPEC / TSPEC / UISPEC. La V3 **construit la
plateforme** sur les fondations fonctionnelles de la V2 (STRAT.01) : industrialiser les imports,
rendre la plateforme extensible, renforcer l'administration, l'observabilité et la personnalisation.

> La V3 ne remet pas en cause les principes fondateurs (planning = produit ; décisions métier
> déterministes ; IA d'assistance uniquement ; expériences séparées ; connecteurs sans logique
> métier ; données brutes conservées).

---

# Vue d'ensemble des EPICs

| EPIC | Titre | ADR / sources | Dépend de |
|------|-------|---------------|-----------|
| V3-00 | Platform Foundation (Event Bus, Config, base observabilité) | ADR.12, ADR.23 | — |
| V3-01 | Secrets Management | ADR.21 | V3-00 |
| V3-02 | Import Connector Framework + Raw Event Model | ADR.13, ADR.15 | V3-00 |
| V3-03 | Import Pipeline | ADR.14 | V3-02 |
| V3-04 | Connecteurs déterministes : CSV / JSON | ADR.13/14/15 | V3-03 |
| V3-05 | Connecteurs OCR : Image / PDF (upload, drag&drop, paste) | ADR.14, ADR.16 | V3-03 |
| V3-06 | AI Provider Framework (BYO-key par profil, opt-in par cas) | ADR.16, ADR.21 | V3-01, V3-03 |
| V3-07 | Connecteur URL / provider (capture) | ADR.13/14, ADR.16 | V3-03, V3-06 |
| V3-08 | Organization Domain (adresses, settings, opérations org-scoped) | ADR.18 | — |
| V3-09 | Localisation par pays + code postal (région dérivée) | ADR.18 (adresses), chantier §8 | V3-08 |
| V3-10 | User Preferences Model | ADR.20 | — |
| V3-11 | Follow Domain | ADR.19 | V3-10 |
| V3-12 | Notification Framework (canaux, fréquences, familles technique/utilisateur) | ADR.17, ADR.20 | V3-00, V3-10 |
| V3-13 | Observabilité & supervision Operator (monitoring, journaux, stats) | ADR.23 | V3-00 |
| V3-14 | Configuration Operator (technique, mail, IA) | ADR.12 §9, ADR.21 | V3-01, V3-06 |
| V3-15 | Profil & identité utilisateur (menu unifié, préférences, thème) | ADR.20, ADR.22 | V3-10 |
| V3-16 | Présentation du planning (vignettes, sections, vues calendrier) | chantier §4 | — |
| V3-17 | Charte de couleurs par univers | chantier §7 | — |
| V3-18 | Finalisation V3 (qualité, exploitation, doc, revue sécurité) | ADR.12, ADR.23 | tous |

> **Identité** : une seule identité de compte (V2), plusieurs rôles attribués entre lesquels
> l'utilisateur bascule. ADR.22 régit l'**identité visuelle** par rôle (tokens de design ; la couleur
> suit l'expérience active) — cf. V3-17. Aucun arbitrage bloquant.

---

# Fondations (V3-00 → V3-01)

## V3-00 — Platform Foundation

**Objectif** : poser les mécanismes transverses de la plateforme.
- Event Bus interne (événements métier : `ImportCompleted`, `EventPublished`, `ParticipationChanged`,
  `NotificationRequested`…) — découplage des domaines (ADR.12 §5).
- Couche de configuration centralisée (système / organisation / utilisateur) (ARCHI.04).
- Base d'observabilité (logs structurés, métriques, traces) (ADR.23).

**Réf.** : ADR.12, ADR.23, ARCHI.02, ARCHI.04.

## V3-01 — Secrets Management

**Objectif** : composant dédié ; le domaine ne manipule que des **références logiques** ; chiffrement
au repos ; jamais versionné ni renvoyé en clair (ADR.21).

**Réf.** : ADR.21.

---

# Industrialisation des imports (V3-02 → V3-07)

## V3-02 — Import Connector Framework + Raw Event Model

Framework unique de connecteurs (interface commune, sans logique métier) ; contrat **Raw Event**
entre connecteurs et pipeline (ADR.13, ADR.15). Conserve les données brutes (rejeu, réanalyse).

## V3-03 — Import Pipeline

Pipeline unique à étapes à responsabilité unique : Découverte → Lecture → Extraction → Raw Event →
Validation → Normalisation → Imported Event → Persistance (ADR.14). Historique complet par `ImportJob`.

## V3-04 — Connecteurs CSV / JSON (déterministes)

Upload **ou** copier-coller d'un fichier formaté (schéma documenté) ; **aucune IA ni OCR**. Premier
connecteur de bout en bout (valide le framework).

## V3-05 — Connecteurs Image / PDF (OCR)

Acquisition upload + drag&drop + copier-coller ; OCR interne (Tesseract) → classifier déterministe.

## V3-06 — AI Provider Framework

L'IA = fournisseur externe encapsulé (ADR.16), **par profil** (Explorer/Organizer/Operator),
**opt-in**, activable **par cas d'usage** ; clés API = secrets par utilisateur (ADR.21). 1er cas :
**remplacer l'OCR** (extraction) — la décision métier reste au classifier déterministe.

## V3-07 — Connecteur URL / provider

Capture des événements d'une page/fournisseur → Raw Event → pipeline. Extraction assistée par IA
possible (V3-06), décision déterministe conservée.

---

# Domaines métier & personnalisation (V3-08 → V3-12)

## V3-08 — Organization Domain

Organization = entité de premier niveau (ADR.18) : membres, **adresses**, settings, connecteurs
configurés. Opérations réalisées « au nom d'une organisation ». Page de paramètres gérée par
l'organizer (`organization.manage`) ; accès admin support-only (chantier §8.3).

## V3-09 — Localisation par pays + code postal

Sélection/recherche `pays + code postal` → commune(s) ; **région dérivée** de la ville. Indexation du
code postal. Adresses d'organisation proposées à la création manuelle d'un événement (chantier §8).

## V3-10 — User Preferences Model

Modèle unique de préférences (ADR.20) : référence officielle, consultée par les autres composants
(thème, langue, notifications, IA…). Ne se substitue pas aux entités métier (Follow reste distinct).

## V3-11 — Follow Domain

Follow = entité indépendante avec cycle de vie propre (ADR.19), **pas** une préférence : suivi
d'organisateurs / activités / lieux. Alimente Discovery et les notifications « information Explorer ».

## V3-12 — Notification Framework

Framework unique (ADR.17) : le domaine publie un événement métier, le framework décide **qui / quand /
comment**. Deux familles : **techniques** (workflow → organizer/operator) et **utilisateur**
(information Explorer, via Follow). Administration des **vecteurs** (in-app/email/push) et des
**fréquences** (immédiate/quotidienne/hebdomadaire) ; préférences par utilisateur (chantier §1).
Questions ouvertes à trancher dans le FSPEC (canal interne, récaps, défauts).

---

# Administration & expérience (V3-13 → V3-17)

## V3-13 — Observabilité & supervision Operator

Logs / métriques / traces / statistiques (ADR.23) ; écrans Operator `OPE-006 Monitoring`,
`OPE-007 Journaux` (complète le tableau de bord de supervision V2).

## V3-14 — Configuration Operator

Écran `OPE-005 Configuration` : paramètres techniques, **configuration mail** (SMTP/provider, test
d'envoi), **configuration IA** plateforme. S'appuie sur Secrets Management (V3-01).

## V3-15 — Profil & identité utilisateur

Menu profil unifié (avatar + nickname, toujours visible) → données personnelles, rôles/permissions,
organisations, configurations personnelles (IA), préférences (**thème** clair/obscur/système)
(chantier §5). Identité visuelle du rôle actif portée par ADR.22.

## V3-16 — Présentation du planning

Vignette de couverture (1ʳᵉ image) ; Accueil « À venir » (planning) et « À découvrir »
(recommandations) en 3 sections (aujourd'hui/semaine/mois) ; Mon planning avec **vues calendrier**
(jour/semaine/mois), accès au passé, interactions (chantier §4).

## V3-17 — Charte de couleurs par univers (ADR.22)

Explorer magenta / Organizer vert / Operator violet. **Décision tranchée** (ADR.22) : la couleur
**suit l'expérience active** de l'utilisateur — une page accessible à deux profils change de couleur
selon le profil utilisé. Les composants n'utilisent que des **tokens de design** (jamais de couleur
en dur : `var(--exp)`, pas `var(--accent)`). À ancrer dans un **UISPEC** (aujourd'hui seulement dans
`styles.css`).

---

# V3-18 — Finalisation

Qualité (unit / intégration / E2E / performance), exploitation (images Docker de production, K8s,
sauvegardes, monitoring), documentation, optimisations, **revue de sécurité** (ADR.21, ADR.12 §10).

---

# Index des spécifications par domaine

Les EPICs sont déclinés en **tranches documentaires** par domaine, nommées
`XX-SHORTNAME.YY-Name-v3.0.md` (`YY` numéroté par domaine). Chaque tranche comprend un FSPEC, un
TSPEC et un UISPEC.

| YY | Domaine | EPIC(s) | FSPEC / TSPEC / UISPEC |
|----|---------|---------|------------------------|
| 01 | Import (framework, pipeline, Raw Event, canaux) | V3-02→07 | `*.01-Import` |
| 02 | Organization | V3-08 | `*.02-Organization` |
| 03 | Localization (pays + code postal) | V3-09 | `*.03-Localization` |
| 04 | Notification | V3-12 | `*.04-Notification` |
| 05 | Preferences | V3-10 | `*.05-Preferences` |
| 06 | Follow | V3-11 | `*.06-Follow` |
| 07 | AI (assistance) | V3-06 | `*.07-AI` |
| 08 | Secrets | V3-01 | `*.08-Secrets` |
| 09 | Configuration Operator | V3-14 | `*.09-Configuration` |
| 10 | Observability | V3-13 | `*.10-Observability` |
| 11 | Profile (menu unifié) | V3-15 | `*.11-Profile` |
| 12 | Planning | V3-16 | `*.12-Planning` |
| 13 | Visual Identity (charte) | V3-17 | `*.13-VisualIdentity` |

> `XX` = collection : `02-FSPEC`, `03-TSPEC`, `04-UISPEC`. Les fondations transverses (V3-00 Platform
> Foundation, V3-18 Finalisation) restent portées par les ARCHI/ADR et le présent RMAP, sans tranche
> FSPEC/TSPEC/UISPEC dédiée.

---

# Jalons proposés

1. **Socle plateforme** : V3-00, V3-01.
2. **Imports industrialisés** : V3-02 → V3-05 (déterministe + OCR), puis V3-06/V3-07 (IA + URL).
3. **Domaines & perso** : V3-08 → V3-12.
4. **Administration & expérience** : V3-13 → V3-17.
5. **Finalisation** : V3-18.

---

# Documents liés

10-STRAT.01-ProductVision-v3.0 · 01-ARCHI.01–04-v3.0 · 99-ADR.12–23 · 00-CoherenceReview-v3.0 ·
00-Chantiers-V3-TODO · 02-FSPEC.01–13 / 03-TSPEC.01–13 / 04-UISPEC.01–13 (V3).

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Premier découpage en EPICs de la V3. |
