# Notifications — Spécification fonctionnelle

**Document** : FSPEC.04

**Fichier** : 02-FSPEC.04-Notification-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Décrire le **Notification Framework** unique de la V3 : les modules métier publient un **événement
métier**, le framework décide **qui / quand / comment** notifier, de façon déterministe et
personnalisable. Couvre les **deux familles** de notifications (technique / utilisateur),
l'**administration** des vecteurs et fréquences (Operator) et les **préférences** individuelles
(Explorer).

Met en œuvre **ADR.17** (Notification Framework) et **ADR.20** (User Preferences), dans le respect de
l'**ADR.12**. Intègre le chantier §1.

> **Règle d'or maintenue** : la décision de notifier est **déterministe** (règles + préférences), jamais
> prise par une IA. Le domaine métier **ignore** les canaux ; il ne publie que des événements.

---

# Deux familles de notifications (chantier §1)

Aucune n'est réellement implémentée en V2 (seul un socle générique existe) ; la V3 les définit
explicitement.

| Famille | Destinataires | Déclencheur | Exemples |
|---------|---------------|-------------|----------|
| **Technique (workflow)** | Organizer / Operator (plus tard Explorer) | fin/état d'un traitement | `ImportCompleted`, `ImportFailed`, `ImportJob` prêt à valider |
| **Utilisateur (information)** | Explorer | publication pertinente selon ses **suivis** | nouvel événement d'un organisateur/activité suivi (FSPEC.06 Follow) |

- La famille **technique** signale qu'un traitement s'est terminé : soit une **action est attendue**
  (valider un import), soit un **résultat est disponible**.
- La famille **utilisateur** informe de **nouveautés pertinentes**, sur la base des **suivis**
  (prérequis : domaine Follow — FSPEC.06).

---

# Chaîne de traitement (ADR.17)

```
Événement métier → Notification Policy (déterministe) → Channel Router (préférences)
                 → Delivery Provider (canal) → Utilisateur → Historisation
```

1. **Événement métier** publié sur l'Event Bus (`ImportCompleted`, `EventPublished`,
   `ParticipationChanged`, `FollowedOrganizerPublished`…). Le domaine ne connaît pas les canaux.
2. **Notification Policy** — décide s'il faut notifier, **qui**, la **priorité**, le **type de message**.
   Entièrement déterministe.
3. **Channel Router** — choisit les **vecteurs** selon les **réglages globaux** (Operator) et les
   **préférences individuelles** (Explorer), et la **fréquence** (immédiate / récap).
4. **Delivery Provider** — in-app, email, push… ajout d'un canal = évolution purement technique.
5. **Historisation** — toute notification produite est conservée (audit, consultation, statistiques).

---

# Vecteurs & fréquences (chantier §1)

## Vecteurs (canaux)

`in-app`, `email`, `push` (V3) ; `web push`, `SMS`, `webhook` = évolutions futures (ADR.17). Chaque
vecteur est **activable/désactivable globalement** par l'Operator.

## Fréquences (pistes indépendantes)

`immédiate`, `récap quotidien`, `récap hebdomadaire`. Chaque **piste de fréquence** est **indépendante**
et activable par l'Operator.

## Réglage individuel (Explorer)

Pour chaque **fréquence active** (activée globalement), l'utilisateur choisit le **vecteur** — ou
« aucun ». Exemple : *immédiat = aucun · récap quotidien = push · récap hebdo = email*.

> Le **moteur tient compte des deux niveaux** : réglages globaux (Operator) **et** préférences
> individuelles (Explorer). Un vecteur/fréquence désactivé globalement n'est jamais proposé ni envoyé.

---

# Priorité & regroupement (ADR.17)

- **Priorité** : `information` (peut être différée) · `important` (envoi rapide) · `critique`
  (diffusion immédiate). La priorité peut **outrepasser** un réglage de récap (une notification critique
  n'attend pas le récap).
- **Regroupement** : le framework peut agréger des notifications similaires dans un **récap**
  (« 5 nouveaux événements découverts », « 3 imports terminés »).

---

# Règles fonctionnelles

## RG-NOTIF-01 — Domaine découplé

Aucun module métier n'envoie de notification directement. Il publie un événement métier ; le framework
décide de tout le reste.

## RG-NOTIF-02 — Décision déterministe

La Notification Policy repose uniquement sur des règles et des préférences configurées. Aucune IA.

## RG-NOTIF-03 — Double niveau de réglage

Un envoi respecte **à la fois** les réglages globaux (Operator : vecteurs/fréquences actifs) **et** les
préférences individuelles. Le plus restrictif l'emporte (« aucun » individuel bloque l'envoi).

## RG-NOTIF-04 — Pistes de fréquence indépendantes

Les fréquences (immédiate/quotidienne/hebdomadaire) sont réglées **indépendamment** l'une de l'autre,
chacune avec son propre vecteur (ou aucun).

## RG-NOTIF-05 — Priorité critique

Une notification `critique` est diffusée immédiatement, indépendamment des réglages de récap (jamais
différée).

## RG-NOTIF-06 — Historisation & traçabilité

Toute notification produite est historisée et **traçable jusqu'à son événement métier d'origine**
(ADR.17). L'historique est consultable par l'utilisateur.

## RG-NOTIF-07 — Familles et destinataires

Les notifications **techniques** ciblent l'organizer/operator concerné (workflow) ; les notifications
**utilisateur** ciblent les explorers selon leurs **suivis** (FSPEC.06). Aucune fuite inter-tenant.

---

# Décisions ouvertes tranchées ici (chantier §1)

## Rôle du canal interne (in-app)

**Décision** : le canal **in-app est toujours actif** comme **historique consultable** ; les réglages
(globaux/individuels) ne pilotent que les **envois sortants** (email/push). L'utilisateur retrouve
toujours ses notifications dans l'application, même s'il n'a activé aucun vecteur sortant.
*(Alternative rejetée : in-app comme vecteur désactivable — priverait l'utilisateur de tout historique.)*

## Récaps quotidien / hebdomadaire

**Décision** : **planificateur intégré** (job récurrent) qui agrège les notifications en attente par
utilisateur et par piste, puis délègue l'envoi au framework. *(Alternative — commande `run-digest`
déclenchée par cron externe — reste possible en exploitation mais n'est pas le mécanisme de référence.)*
Détail technique : TSPEC.04.

## Réglage par défaut d'un nouvel utilisateur

**Décision** : par défaut, **in-app actif** (historique) + **récap hebdomadaire par email** ;
immédiat = aucun, récap quotidien = aucun. Choix prudent (peu intrusif), modifiable à tout moment.

---

# Correspondance avec la V2 implémentée

- Un **socle générique** existe déjà (modèle Notification, canal in-app + email/push **stubbés**, API
  personnelle, badge), avec **une seule source branchée** : changement d'état d'un événement au planning
  → participants. La V3 **conserve** ce socle et le **généralise** : Event Bus, Policy déterministe,
  deux familles, vecteurs/fréquences administrables, préférences individuelles.

---

# Parcours

- **Explorer** : ouvrir ses préférences de notification → pour chaque fréquence active, choisir le
  vecteur (ou aucun) → consulter l'historique in-app (badge).
- **Operator** : activer/désactiver globalement les vecteurs et fréquences → suivre les métriques
  d'envoi (ADR.23).
- **Système** : un traitement publie un événement métier → le framework décide et diffuse.

(Détail des écrans : UISPEC.04 Notification.)

---

# Hors périmètre (V3)

- SMS, Webhook, Web Push (préparés par l'architecture — ADR.17 — non implémentés ; Backlog V4).
- Règles de notification par organisation avancées (Backlog V4).

---

# Documents liés

99-ADR.17-NotificationFramework · 99-ADR.20-UserPreferences · 99-ADR.12 · 99-ADR.23-Observability ·
03-TSPEC.04-Notification-v3.0 · 04-UISPEC.04-Notification-v3.0 · 02-FSPEC.05-Preferences-v3.0 ·
02-FSPEC.06-Follow-v3.0 · 02-FSPEC.01-Import-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification fonctionnelle du framework de notifications (deux familles, vecteurs/fréquences, préférences, décisions ouvertes tranchées). |
