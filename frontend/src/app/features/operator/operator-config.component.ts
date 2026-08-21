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
  templateUrl: './operator-config.component.html',
  styleUrl: './operator-config.component.css',
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
