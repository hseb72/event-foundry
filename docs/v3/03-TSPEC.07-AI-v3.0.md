# Intelligence artificielle — Spécification technique

**Document** : TSPEC.07

**Fichier** : 03-TSPEC.07-AI-v3.0.md

**Version** : 3.0

**Statut** : En rédaction

---

# Objectif

Définir l'architecture technique de l'IA d'assistance (ADR.16) : abstraction fournisseur, résolution de
configuration par profil / organisation, intégration au pipeline d'import, traçabilité des appels, et
articulation avec le Secrets Management (ADR.21) pour les clés. Aucune décision métier n'est déléguée à
l'IA.

---

# Position & module

Domaine `ai` (module NestJS), Prisma confiné aux Repositories (ADR.02). Le domaine métier **n'accède
jamais** à une API d'IA : il dépend d'une **interface d'assistance** (`AssistantPort`), jamais d'une
implémentation de fournisseur (ADR.07/16).

```
ai/
  ports/           AssistantPort (interface d'assistance)
  providers/       adaptateurs par fournisseur (OpenAI, Anthropic, Gemini, Mistral, Ollama…)
  usecases/        cas d'usage encapsulés (OcrAssist, TranslateAssist, SummarizeAssist…)
  config/          résolution de config IA (profil / organisation / plateforme)
  repositories/    AiConfig, AiCallLog (Prisma)
  services/ · dto/ · mappers/ · interfaces/
```

---

# Port d'assistance (abstraction)

```ts
interface AssistantPort {
  readonly useCase: AiUseCase;          // OCR | DOC_UNDERSTANDING | TRANSLATE | REPHRASE | SUMMARIZE | ENRICH
  isConfigured(scope: AiScope): Promise<boolean>;
  run(input: AssistInput, scope: AiScope): Promise<AssistOutput>; // proposition, jamais décision
}
```

- Un **adaptateur par fournisseur** implémente l'accès concret ; le remplacement d'un fournisseur
  n'impacte **aucune** règle métier (ADR.16 indépendance).
- La **sortie** (`AssistOutput`) est une **proposition** transmise au pipeline / à la validation, jamais
  une donnée métier figée (RG-AI-01/07).

---

# Configuration IA & résolution de portée

```prisma
model AiConfig {
  id           String  @id @default(uuid())
  scope        AiScope        // PLATFORM | ORGANIZATION | USER
  scopeId      String? @map("scope_id")   // orgId / userId selon la portée
  provider     String                     // openai | anthropic | gemini | mistral | ollama | …
  model        String
  secretRef    String  @map("secret_ref") // RÉFÉRENCE logique vers le secret (ADR.21) — jamais la clé
  enabled      Boolean @default(false)    // opt-in (RG-AI-02)
  useCases     Json                       // cas d'usage activés (par cas)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  @@unique([scope, scopeId, provider])
  @@map("ai_configs")
}
```

**Résolution pour un cas d'usage** (du plus spécifique au repli) :

```
organisation active (si configurée & cas activé)
  → profil utilisateur (si configuré & cas activé)
  → plateforme (Operator, si configurée)
  → repli déterministe (ex. OCR Tesseract interne) / abstention   (RG-AI-06)
```

- `secretRef` est une **référence logique** ; la valeur de la clé est résolue **au moment de l'appel**
  par le Secrets Management (TSPEC.08 / ADR.21). La clé **n'est jamais** en base ni en clair (RG-AI-03).
- Les **préférences** (TSPEC.05) portent le **choix de fournisseur + opt-in + cas** ; la config
  technique (`AiConfig`) et le secret sont distincts.

---

# Intégration au pipeline d'import

- À la phase **Extract** (worker, TSPEC.01), le cas d'usage `OcrAssist` est résolu : si une IA est
  configurée et le cas activé pour la portée, l'extraction utilise `AssistantPort.run` ; sinon repli
  Tesseract.
- La sortie alimente la phase **Normalize** (classifier déterministe) — **seul juge** des champs
  (RG-AI-01). L'origine « assistée par IA » est marquée sur le Raw Event / diagnostics (traçabilité).

---

# Traçabilité des appels (ADR.16)

```prisma
model AiCallLog {
  id           String  @id @default(uuid())
  useCase      AiUseCase
  provider     String
  model        String
  promptVersion String @map("prompt_version")
  scope        AiScope
  scopeId      String? @map("scope_id")
  durationMs   Int     @map("duration_ms")
  status       AiCallStatus       // SUCCESS | FAILED | FALLBACK
  correlationId String @map("correlation_id")
  createdAt    DateTime @default(now()) @map("created_at")
  @@index([useCase, createdAt])
  @@map("ai_call_logs")
}
```

- Conserve fournisseur, modèle, **version du prompt**, date, durée, statut — **jamais** le contenu
  sensible ni la clé (RG-AI-04, ADR.21 §Journalisation).
- `correlationId` propagé (import → appel IA → logs) — ADR.23.

---

# Confidentialité & désactivation

- Les données envoyées à l'IA respectent la politique de sécurité ; l'envoi d'informations sensibles
  requiert une **autorisation explicite** de la configuration (RG-AI-05).
- La plateforme peut **désactiver totalement** l'IA (interrupteur global Operator) → tous les cas
  retombent sur le déterminisme (RG-AI-06).

---

# Correspondance avec la V2

| V2 | V3 |
|----|----|
| OCR Tesseract interne (extraction) | conservé comme **repli** ; IA externe possible en amont |
| Classifier déterministe (décision) | **inchangé** — seul juge des champs |
| — | `AiConfig` (par portée), `AssistantPort`, `AiCallLog`, secrets via ADR.21 |

---

# Contraintes

- IA = assistance encapsulée (jamais de décision) ; abstraction fournisseur ; clés = références de
  secrets (ADR.21) ; opt-in par profil et par cas ; repli déterministe ; traçabilité complète ; Prisma
  confiné aux Repositories. Toute évolution de la frontière IA = nouvel ADR (ADR.16).

---

# Documents liés

99-ADR.16-AIBoundaries · 99-ADR.21-SecretsManagement · 99-ADR.14/15/23 · 02-FSPEC.07-AI-v3.0 ·
04-UISPEC.07-AI-v3.0 · 03-TSPEC.01-Import-v3.0 · 03-TSPEC.08-Secrets-v3.0 · 03-TSPEC.05-Preferences-v3.0

---

# Historique

| Version | Description |
|----------|-------------|
| 3.0 | Première spécification technique de l'IA d'assistance (port fournisseur, config par portée, intégration import, traçabilité). |
