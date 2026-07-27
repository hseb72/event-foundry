import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpandableCardComponent } from '../../shared/expandable-card.component';
import { PlatformConfigApi, PlatformGeneralInfo } from '../../core/api/platform-config.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { NotificationsApi } from '../../core/api/notifications.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import {
  AI_USE_CASES,
  AiProviderInfo,
  AiUseCase,
  NotificationSettings,
  ReferentialItem,
  TechnicalConfig,
} from '../../core/models';

/**
 * Configuration plateforme Operator (OPE-005 / FSPEC.09) : mail (SMTP) et IA plateforme. Les clés
 * transitent comme secrets (jamais réaffichées). Couleur Operator via les tokens (--exp).
 */
@Component({
  selector: 'app-operator-config',
  standalone: true,
  imports: [FormsModule, ExpandableCardComponent],
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
      <app-expandable-card cardTitle="Informations générales">
        <p class="muted" style="font-size:0.78rem;margin:0 0 0.6rem">Identité publique de la plateforme.</p>
        <div class="two">
          <div class="field"><label class="muted">Nom de la plateforme</label><input class="input" [(ngModel)]="general.platformName" /></div>
          <div class="field"><label class="muted">E-mail de contact</label><input class="input" [(ngModel)]="general.contactEmail" /></div>
          <div class="field"><label class="muted">E-mail support</label><input class="input" [(ngModel)]="general.supportEmail" /></div>
          <div class="field"><label class="muted">E-mail recrutement</label><input class="input" [(ngModel)]="general.recruitmentEmail" placeholder="(facultatif)" /></div>
        </div>
        <div class="field" style="margin-top:0.6rem"><label class="muted">Informations publiques</label>
          <input class="input" [(ngModel)]="general.publicInfo" placeholder="Données institutionnelles (facultatif)" /></div>
        <div style="margin-top:0.6rem"><button class="btn btn-primary" (click)="saveGeneral()">Enregistrer</button>
          @if (generalSaved()) { <span class="status">Enregistré</span> }</div>
      </app-expandable-card>

      <app-expandable-card cardTitle="Configuration mail (SMTP)">
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
      </app-expandable-card>

      <app-expandable-card cardTitle="IA plateforme">
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
      </app-expandable-card>

      <app-expandable-card cardTitle="Limites techniques">
        <p class="muted" style="font-size:0.78rem;margin:0 0 0.8rem">
          Bornes appliquées à l'acquisition. La taille d'upload ne peut dépasser le plafond dur
          ({{ techHardMax() }} Mo).
        </p>
        <div class="field">
          <label class="muted">Taille maximale d'un document (Mo)</label>
          <input class="input" type="number" min="1" [max]="techHardMax()" [(ngModel)]="techMaxUploadMb" />
        </div>
        <div class="field">
          <label class="muted">Plafond quotidien d'imports (0 = illimité)</label>
          <input class="input" type="number" min="0" [(ngModel)]="techMaxImportsPerDay" />
        </div>

        <hr style="border:0;border-top:1px solid var(--border);margin:0.8rem 0" />
        <label class="switch"><input type="checkbox" [(ngModel)]="techAutoProvision" /> Auto-création des référentiels manquants</label>
        <p class="muted" style="font-size:0.76rem;margin:0.35rem 0 0.6rem">
          À l'import, un libellé inconnu (activité, type, lieu…) crée automatiquement le référentiel en
          état <em>provisoire</em>, à curer ensuite. Décoché : les libellés inconnus sont proposés à la
          création en validation (ADR.24).
        </p>
        @if (techAutoProvision) {
          <div class="field">
            <label class="muted">Domaine par défaut (pour les activités auto-créées)</label>
            <select class="select" [(ngModel)]="techDefaultDomainId">
              <option value="">— aucun (les activités inconnues ne seront pas auto-créées) —</option>
              @for (d of domains; track d.id) { <option [value]="d.id">{{ d.name }}</option> }
            </select>
          </div>
        }
        <div class="row">
          <button class="btn btn-primary" (click)="saveTechnical()">Enregistrer</button>
          @if (techStatus()) { <span class="status">{{ techStatus() }}</span> }
        </div>
      </app-expandable-card>

      @if (notifSettings) {
        <app-expandable-card cardTitle="Notifications">
          <p class="muted" style="font-size:0.78rem;margin:0 0 0.6rem">
            Active/désactive globalement les vecteurs et les pistes de fréquence. Le canal interne
            (in-app) reste toujours actif (historique). Le plus restrictif l'emporte : un vecteur
            désactivé ici n'est jamais proposé aux utilisateurs.
          </p>
          <div class="muted" style="font-size:0.76rem;margin-bottom:0.3rem">Vecteurs sortants</div>
          <label class="switch"><input type="checkbox" [(ngModel)]="notifSettings.vectors.email" /> E-mail</label>
          <label class="switch"><input type="checkbox" [(ngModel)]="notifSettings.vectors.push" /> Push</label>
          <div class="muted" style="font-size:0.76rem;margin:0.7rem 0 0.3rem">Pistes de fréquence</div>
          <label class="switch"><input type="checkbox" [(ngModel)]="notifSettings.frequencies.immediate" /> Immédiate</label>
          <label class="switch"><input type="checkbox" [(ngModel)]="notifSettings.frequencies.daily" /> Récap quotidien</label>
          <label class="switch"><input type="checkbox" [(ngModel)]="notifSettings.frequencies.weekly" /> Récap hebdomadaire</label>
          <div class="row">
            <button class="btn btn-primary" (click)="saveNotifSettings()">Enregistrer</button>
            @if (notifStatus()) { <span class="status">{{ notifStatus() }}</span> }
          </div>
        </app-expandable-card>
      }
    </div>
  `,
})
export class OperatorConfigComponent implements OnInit {
  private readonly api = inject(PlatformConfigApi);
  private readonly aiConfigApi = inject(AiConfigApi);
  private readonly referenceData = inject(ReferenceDataApi);
  private readonly notificationsApi = inject(NotificationsApi);

  readonly useCases = AI_USE_CASES;
  readonly generalSaved = signal(false);
  general: PlatformGeneralInfo = {
    platformName: '',
    contactEmail: '',
    supportEmail: '',
    recruitmentEmail: '',
    publicInfo: '',
  };
  readonly mailStatus = signal('');
  readonly aiStatus = signal('');
  readonly techStatus = signal('');
  readonly notifStatus = signal('');
  providers: AiProviderInfo[] = [];
  notifSettings: NotificationSettings | null = null;

  private tech: TechnicalConfig = {
    maxUploadBytes: 20 * 1024 * 1024,
    maxImportsPerDay: 0,
    hardMaxUploadBytes: 20 * 1024 * 1024,
    autoProvisionReferentials: false,
    provisioningDefaultDomainId: null,
  };
  techMaxUploadMb = 20;
  techMaxImportsPerDay = 0;
  techAutoProvision = false;
  techDefaultDomainId = '';
  domains: ReferentialItem[] = [];

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
    this.api.getGeneral().subscribe((info) => {
      this.general = { ...info, recruitmentEmail: info.recruitmentEmail ?? '', publicInfo: info.publicInfo ?? '' };
    });
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
    this.referenceData.domains().subscribe((items) => (this.domains = items));
    this.api.getTechnical().subscribe((config) => this.applyTechnical(config));
    this.notificationsApi.getSettings().subscribe((settings) => (this.notifSettings = settings));
  }

  saveNotifSettings(): void {
    if (!this.notifSettings) {
      return;
    }
    this.notificationsApi.updateSettings(this.notifSettings).subscribe((settings) => {
      this.notifSettings = settings;
      this.notifStatus.set('✓ Enregistré');
    });
  }


  private applyTechnical(config: TechnicalConfig): void {
    this.tech = config;
    this.techMaxUploadMb = Math.round((config.maxUploadBytes / (1024 * 1024)) * 10) / 10;
    this.techMaxImportsPerDay = config.maxImportsPerDay;
    this.techAutoProvision = config.autoProvisionReferentials;
    this.techDefaultDomainId = config.provisioningDefaultDomainId ?? '';
  }

  techHardMax(): number {
    return Math.floor(this.tech.hardMaxUploadBytes / (1024 * 1024));
  }

  saveTechnical(): void {
    this.api
      .updateTechnical({
        maxUploadBytes: Math.round(Number(this.techMaxUploadMb) * 1024 * 1024),
        maxImportsPerDay: Math.max(0, Math.floor(Number(this.techMaxImportsPerDay))),
        autoProvisionReferentials: this.techAutoProvision,
        provisioningDefaultDomainId: this.techDefaultDomainId || undefined,
      })
      .subscribe((config) => {
        this.applyTechnical(config);
        this.techStatus.set('✓ Enregistré');
      });
  }

  toggleUseCase(uc: AiUseCase): void {
    this.ai.useCases = { ...this.ai.useCases, [uc]: !this.ai.useCases[uc] };
  }

  saveGeneral(): void {
    this.generalSaved.set(false);
    this.api
      .updateGeneral({
        platformName: this.general.platformName.trim(),
        contactEmail: this.general.contactEmail.trim(),
        supportEmail: this.general.supportEmail.trim(),
        recruitmentEmail: this.general.recruitmentEmail?.trim() || null,
        publicInfo: this.general.publicInfo?.trim() || null,
      })
      .subscribe(() => this.generalSaved.set(true));
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
