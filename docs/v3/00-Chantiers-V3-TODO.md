# Chantiers V3 — capture (TODO)

> **Statut : brouillon de travail.** Liste brute des chantiers pressentis pour la V3, notée au
> fil de l'eau. À restructurer ensuite en documentation V3 formelle (ADR + FSPEC/TSPEC/UISPEC).
> Rien n'est arbitré ici : les points ouverts sont marqués **[à trancher]**.
>
> Principe fondateur à préserver ou à réviser explicitement : règle d'or n°1 — *aucune décision
> métier par une IA générative* (une révision de ce principe passe obligatoirement par un ADR).

---

## 1. Administration des notifications

- [ ] **Opérateur — page d'admin** : gérer les **vecteurs** (in-app, email, push, …) et les
      **fréquences** (immédiate, quotidienne, hebdomadaire, …), activer / désactiver globalement.
- [ ] **Explorer — page de préférences** : pour chaque **fréquence active** (activée par
      l'opérateur), choisir le **vecteur** (ou « aucun »). Ex : immédiat = aucun · récap quotidien =
      push · récap hebdo = email. Pistes de fréquence **indépendantes**.
- [ ] **Moteur** : tenir compte de ces réglages (globaux + individuels) à chaque envoi.
- [ ] **Deux catégories de notifications à couvrir** (aucune n'est encore implémentée) :
  - [ ] **Workflow technique** → organisateur / opérateur (plus tard explorer) : un traitement
        s'est terminé ; soit une action est attendue, soit le résultat est disponible.
        (Brancher les transitions du pipeline d'import : `ImportJob` READY_FOR_VALIDATION /
        COMPLETED / FAILED → notifier l'organisateur / opérateur concerné.)
  - [ ] **Information Explorer** : de nouveaux événements susceptibles de l'intéresser viennent
        d'être publiés (organisateurs suivis / activités suivies dans son périmètre).
        **Prérequis : introduire la notion de « suivis »** (voir §5).
- **Existant V2** : socle générique déjà livré (modèle Notification, canal in-app + email/push
  stubbés, API personnelle, badge), avec **une seule source branchée** : changement d'état d'un
  événement déjà au planning → participants. À conserver ou à remplacer selon la cible.
- **[à trancher]** Rôle du canal interne : *toujours actif* (historique consultable, les réglages
  ne pilotent que les envois sortants) **vs** *vecteur comme les autres* (désactivable).
- **[à trancher]** Récaps quotidien/hebdo : *modèle + déclencheur* (commande `run-digest` appelée
  par un cron) **vs** *planificateur intégré* (job récurrent BullMQ).
- **[à trancher]** Réglage par défaut d'un nouvel utilisateur avant configuration.

---

## 2. Configuration technique / mail / IA (pages d'administration)

- [ ] **Configuration technique** (écran `OPE-005` prévu, non construit) : paramètres d'exploitation.
- [ ] **Configuration mail** : provider / SMTP, expéditeur, test d'envoi.
- [ ] **Configuration IA — par profil** : chaque profil **Explorer / Organizer / Operator** peut
      brancher **sa propre IA** (provider + clé API + …). Opt-in. S'il l'active, il choisit **dans
      quelles circonstances** l'IA peut être sollicitée (page listant les cas possibles).
  - [ ] **1er cas d'usage** : remplacer l'OCR interne (aujourd'hui très mauvais) lors des imports.
- **Secrets** : clés API / identifiants SMTP **jamais versionnés, jamais renvoyés en clair**
  (masqués `sk-…abcd`), chiffrés au repos, idéalement hors base applicative (K8s Secret / vault) ;
  la base ne garde qu'un pointeur + statut « configuré / testé » (règle d'or §10).
- **[à trancher — ADR requis]** **Frontière IA** : où l'IA devient permise vs reste bannie.
  Recommandation par défaut : **IA = extraction (OCR), déterminisme = décision** (le classifier
  déterministe reste seul juge des champs métier). L'option « IA produit directement
  l'EventCandidate » réécrit la règle d'or n°1 → doit être un ADR assumé.

---

## 3. Moteur d'import — enrichissement des canaux d'acquisition

- [ ] **Image / PDF** : upload **+ drag & drop + copier-coller**. OCR interne **ou** IA de
      l'utilisateur (cf. §2) → puis classifier déterministe.
- [ ] **CSV / JSON formaté** : upload **ou** copier-coller du contenu. **Format à documenter.**
      Canal **100 % déterministe** (parsing d'un schéma) — ni OCR ni IA. *Constructible sans
      attendre la gouvernance IA.*
- [ ] **URL d'un provider d'événements** : « capter » les événements de la page et les transformer
      en événements internes (= scraping, était hors-V1 ; extraction IA probable → classifier).
- **[à trancher]** Schéma CSV/JSON cible (colonnes/clés, obligatoires/optionnels, mapping vers
  activité/type/catégorie/commune/dates…).

---

## 4. Présentation du planning (Explorer)

- [ ] **Carte d'événement** : si l'événement possède ≥ 1 image, afficher la **1ʳᵉ image** dans la
      carte. → **stratégie de couverture en liste** (les endpoints de liste renvoient aujourd'hui
      `media: []` ; prévoir une URL de vignette, idéalement mise en cache / CDN).
- [ ] **Accueil** — deux blocs, chacun en **3 sections** (aujourd'hui / cette semaine / ce mois-ci) :
  - [ ] **À venir** : uniquement les événements **qualifiés** par l'utilisateur (intéressé,
        réservé, payé… = son planning).
  - [ ] **À découvrir** : événements **non qualifiés** mais **recommandés** (moteur EPIC 06).
- [ ] **Mon planning** : identique au bloc « À venir » de l'accueil, **plus** :
  - [ ] **Vues calendrier** : jour (heure par heure), semaine (jour par jour), mois (grille).
  - [ ] **Accès au passé** (uniquement ici).
  - [ ] **Interactions** : « je ne suis plus intéressé », « j'ai annulé »… (déjà supporté par
        `PUT /events/:id/participation` — tout remettre à neutre retire l'événement du planning).
- **Existant V2** : « qualifié » = a une participation (mapping direct) ; interactions déjà en
  place ; l'endpoint calendrier renvoie déjà le passé sans borne.
- **[à trancher]** Buckets **imbriqués** (aujourd'hui ⊂ semaine ⊂ mois) **vs disjoints**
  (aujourd'hui / reste de la semaine / reste du mois). Recommandation : disjoints.
- **[à trancher]** Section « plus tard » (> 1 mois) sur Mon planning ?

---

## 5. Menu profil / identité (navigation Web)

- **Problème actuel** : le bloc bas-gauche de la barre latérale (login/email · mode de
  souscription · `[Se déconnecter]`) **sort du viewport** quand le contenu de droite est long
  (la sidebar défile avec la page). De plus, `[Mon identité]` est **dissocié** de ce bloc alors
  qu'il lui est lié.
- [ ] **Menu profil unique** : une **pastille avatar + nickname**, **toujours visible en bas à
      gauche** (sidebar sticky, hauteur viewport), point d'entrée unique vers la gestion du profil.
- [ ] Sections de la gestion de profil :
  - [ ] **Données personnelles** : nickname **modifiable**, rappel du **mail de login**
        (non modifiable).
  - [ ] **Rôles et permissions**.
  - [ ] **Organisations**.
  - [ ] **Configurations personnelles** (IA, … — cf. §2).
  - [ ] **Autres préférences** : thème clair / obscur / système / (autres ?).
- **Existant V2** : `IdentityComponent` (`/me`) affiche déjà rôles / permissions / expériences /
  organisations ; `updateProfile` gère `displayName` + `preferences` (JSONB). À réorganiser en
  sections. **Avatar** : pas de champ image aujourd'hui. **Thème** : pas encore implémenté.
- **Correctif indépendant (quick win possible)** : rendre la sidebar **sticky** (hauteur viewport,
  scroll interne) pour que le bloc profil reste visible — corrigeable sans attendre la refonte.
- **[à trancher]** Avatar : image uploadée (MinIO) **vs** initiales générées / gravatar.
- **[à trancher]** Le sélecteur d'expérience (Explorer/Organizer/Operator) et le contexte
  d'organisation active restent-ils en **haut** de la sidebar, ou rejoignent-ils ce menu profil ?

---

## 6. Transverse — « Suivis » (follows)

- [ ] Introduire l'entité **Follow** (organisateur / lieu / activité) — hors V1 (backlog), requise
      par la catégorie « information Explorer » des notifications (§1) et par les recommandations à
      base de suivis (FSPEC.09).

---

## Notes de méthode

- Une fois cette liste stabilisée : rédiger la V3 structurée (un **ADR** par décision structurante —
  frontière IA, gestion des secrets, administration des notifications, cadence des récaps ;
  puis **FSPEC / TSPEC / UISPEC** correspondants).
- Les écrans Operator prévus mais non construits (`OPE-005 Configuration`, `OPE-006 Monitoring`,
  `OPE-007 Journaux`) accueillent naturellement les §1 et §2.
