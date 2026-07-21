import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlatformConfigApi } from '../../core/api/platform-config.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { AI_USE_CASES, AiProviderInfo, AiUseCase } from '../../core/models';

/**
 * Configuration plateforme Operator (OPE-005 / FSPEC.09) : mail (SMTP) et IA plateforme. Les clés
 * transitent comme secrets (jamais réaffichées). Couleur Operator via les tokens (--exp).
 */
@Component({
  selector: 'app-operator-config',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        align-items: start;
      }
      .card h2 {
        font-size: 1rem;
        margin: 0 0 0.75rem;
      }
      .field {
        display: grid;
        gap: 0.5rem;
        margin-bottom: 0.6rem;
      }
      .two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .switch {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .uc {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        border-radius: 10px;
        padding: 0.35rem 0.7rem;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .uc.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
      .status {
        font-size: 0.8rem;
        font-weight: 700;
        margin-left: 0.5rem;
      }
      .row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.5rem;
      }
    `,
  ],
  template: `
    <h1>Configuration</h1>
    <p class="muted">Paramètres de la plateforme : mail et intelligence artificielle.</p>

    <div class="grid">
      <section class="card">
        <h2>Configuration mail (SMTP)</h2>
        <div class="two">
          <div class="field"><label class="muted">Hôte</label><input class="input" [(ngModel)]="mail.host" placeholder="smtp.example.com" /></div>
          <div class="field"><label class="muted">Port</label><input class="input" type="number" [(ngModel)]="mail.port" /></div>
        </div>
        <label class="switch"><input type="checkbox" [(ngModel)]="mail.secure" /> Connexion sécurisée (TLS)</label>
        <div class="field" style="margin-top:0.6rem"><label class="muted">Expéditeur</label><input class="input" [(ngModel)]="mail.from" placeholder="no-reply@eventfoundry.app" /></div>
        <div class="two">
          <div class="field"><label class="muted">Identifiant</label><input class="input" [(ngModel)]="mail.username" /></div>
          <div class="field"><label class="muted">Mot de passe</label>
            <input class="input" type="password" [(ngModel)]="mailPassword"
                   [placeholder]="mail.passwordMasked ? 'Enregistré (' + mail.passwordMasked + ') — vide = inchangé' : 'Mot de passe SMTP'" />
          </div>
        </div>
        <div class="row">
          <button class="btn btn-primary" (click)="saveMail()">Enregistrer</button>
          <button class="btn" (click)="testMail()" [disabled]="!mail.passwordMasked">Tester l'envoi</button>
          @if (mailStatus()) { <span class="status">{{ statusLabel(mailStatus()) }}</span> }
        </div>
      </section>

      <section class="card">
        <h2>IA plateforme</h2>
        <p class="muted" style="font-size:0.78rem;margin:0 0 0.6rem">
          IA par défaut (repli quand aucune IA d'organisation/utilisateur). Décocher « Activer » coupe
          l'IA plateforme (repli déterministe).
        </p>
        <label class="switch"><input type="checkbox" [(ngModel)]="ai.enabled" /> Activer l'IA plateforme</label>
        <div class="two" style="margin-top:0.6rem">
          <div class="field"><label class="muted">Fournisseur</label>
            <select class="select" [(ngModel)]="ai.provider">
              <option value="">Fournisseur…</option>
              @for (p of providers; track p.id) {
                <option [value]="p.id">{{ p.label }}</option>
              }
            </select>
          </div>
          <div class="field"><label class="muted">Modèle</label>
            <input class="input" [(ngModel)]="ai.model" list="ope-ai-models" placeholder="Modèle (vision)" />
            <datalist id="ope-ai-models">
              @for (m of modelsFor(ai.provider); track m) {
                <option [value]="m"></option>
              }
            </datalist>
          </div>
        </div>
        <div class="field"><label class="muted">Clé API</label>
          <input class="input" type="password" [(ngModel)]="aiKey"
                 [placeholder]="ai.secretMasked ? 'Enregistrée (' + ai.secretMasked + ') — vide = inchangée' : 'Clé API'" />
          @if (providerInfo(ai.provider); as pi) {
            <span class="muted" style="font-size:0.76rem">
              @if (pi.requiresKey) {
                Clé {{ pi.keyHint }}
                @if (pi.keyUrl) { · <a [href]="pi.keyUrl" target="_blank" rel="noopener" style="color:var(--exp)">obtenir une clé ↗</a> }
              } @else { {{ pi.keyHint }} }
            </span>
          }
        </div>
        <div class="muted" style="font-size:0.76rem;margin-bottom:0.3rem">Cas d'usage</div>
        <div class="chips">
          @for (uc of useCases; track uc) {
            <button type="button" class="uc" [class.on]="ai.useCases[uc]" (click)="toggleUseCase(uc)">{{ uc }}</button>
          }
        </div>
        <div class="row">
          <button class="btn btn-primary" (click)="saveAi()">Enregistrer</button>
          <button class="btn" (click)="testAi()" [disabled]="!ai.secretMasked">Tester</button>
          @if (aiStatus()) { <span class="status">{{ statusLabel(aiStatus()) }}</span> }
        </div>
      </section>
    </div>
  `,
})
export class OperatorConfigComponent implements OnInit {
  private readonly api = inject(PlatformConfigApi);
  private readonly aiConfigApi = inject(AiConfigApi);

  readonly useCases = AI_USE_CASES;
  readonly mailStatus = signal('');
  readonly aiStatus = signal('');
  providers: AiProviderInfo[] = [];

  mail = { host: '', port: 587, secure: true, from: '', username: '', passwordMasked: null as string | null };
  mailPassword = '';
  ai = { provider: '', model: '', enabled: false, useCases: {} as Record<string, boolean>, secretMasked: null as string | null };
  aiKey = '';

  providerInfo(id: string): AiProviderInfo | undefined {
    return this.providers.find((p) => p.id === id);
  }

  modelsFor(id: string): string[] {
    return this.providerInfo(id)?.suggestedModels ?? [];
  }

  ngOnInit(): void {
    this.aiConfigApi.providers().subscribe((providers) => (this.providers = providers));
    this.api.getMail().subscribe((config) => {
      if (config) {
        this.mail = { ...config, username: config.username ?? '' };
        this.mailStatus.set(config.status);
      }
    });
    this.api.getAi().subscribe((config) => {
      if (config) {
        this.ai = {
          provider: config.provider,
          model: config.model,
          enabled: config.enabled,
          useCases: { ...config.useCases },
          secretMasked: config.secret ? config.secret.masked : null,
        };
        this.aiStatus.set(config.status);
      }
    });
  }

  toggleUseCase(uc: AiUseCase): void {
    this.ai.useCases = { ...this.ai.useCases, [uc]: !this.ai.useCases[uc] };
  }

  saveMail(): void {
    this.api
      .updateMail({
        host: this.mail.host.trim(),
        port: Number(this.mail.port),
        secure: this.mail.secure,
        from: this.mail.from.trim(),
        username: this.mail.username.trim() || undefined,
        password: this.mailPassword.trim() || undefined,
      })
      .subscribe((config) => {
        this.mailPassword = '';
        this.mail = { ...config, username: config.username ?? '' };
        this.mailStatus.set(config.status);
      });
  }

  testMail(): void {
    this.api.testMail().subscribe((r) => this.mailStatus.set(r.status));
  }

  saveAi(): void {
    this.api
      .updateAi({
        provider: this.ai.provider.trim(),
        model: this.ai.model.trim(),
        enabled: this.ai.enabled,
        useCases: this.ai.useCases,
        apiKey: this.aiKey.trim() || undefined,
      })
      .subscribe((config) => {
        this.aiKey = '';
        this.ai.secretMasked = config.secret ? config.secret.masked : null;
        this.aiStatus.set(config.status);
      });
  }

  testAi(): void {
    this.api.testAi().subscribe((r) => this.aiStatus.set(r.status));
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIGURED: 'Configuré (non testé)',
      TESTED: '✓ Testé',
      FAILED: '✗ Échec',
    };
    return map[status] ?? status;
  }
}
