import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountApi } from '../../core/api/account.service';
import { IdentityService } from '../../core/api/identity.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';
import {
  AI_USE_CASES,
  AiProviderInfo,
  AiUseCase,
  Experience,
  MunicipalityGeo,
  OrganizationAddress,
  ReferentialItem,
  ThemePreference,
} from '../../core/models';
import { toInitials } from '../../shared/initials';

interface PermissionGroup {
  group: string;
  keys: string[];
}

const EXPERIENCE_LABELS: Record<Experience, string> = {
  EXPLORER: 'Explorer',
  ORGANIZER: 'Organizer',
  OPERATOR: 'Operator',
};

const EXPERIENCE_COLORS: Record<Experience, string> = {
  EXPLORER: 'var(--explorer)',
  ORGANIZER: 'var(--organizer)',
  OPERATOR: 'var(--operator)',
};

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
      }
      .avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--exp);
        color: var(--exp-contrast);
        font-weight: 800;
        font-size: 1rem;
      }
      .theme-opts {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .switch {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .theme-opt {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        border-radius: 10px;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .theme-opt.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
      .soon {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--exp-weak);
        color: var(--exp);
        margin-left: 0.4rem;
      }
      .vecteurs {
        display: grid;
        gap: 0.5rem;
      }
      .vec {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .vec-name {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .pill {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        border-radius: 999px;
        padding: 0.3rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .pill.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
      .pill.locked {
        cursor: default;
        opacity: 0.85;
      }
      .head h1 {
        margin: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
        align-items: start;
      }
      .card h2 {
        font-size: 0.95rem;
        margin: 0 0 0.75rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip {
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .chip.exp {
        color: #fff;
        border: 0;
      }
      .chip.exp.off {
        color: var(--muted);
        background: var(--bg);
        border: 1px dashed var(--border);
      }
      .perm-group {
        margin-bottom: 0.7rem;
      }
      .perm-group .g {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin-bottom: 0.25rem;
      }
      .perm {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.78rem;
        padding: 0.1rem 0.5rem;
        border-radius: 6px;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .org {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.75rem;
        margin-bottom: 0.6rem;
      }
      .org.active {
        border-color: var(--organizer);
        box-shadow: 0 0 0 1px var(--organizer);
      }
      .org-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
      }
      .org-name {
        font-weight: 700;
      }
      .sub {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .badge {
        color: #fff;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .active-tag {
        font-size: 0.72rem;
        color: var(--organizer);
        font-weight: 700;
      }
    `,
  ],
  template: `
    @if (me(); as m) {
      <div class="head">
        <span class="avatar" aria-hidden="true">{{ initials() }}</span>
        <h1>{{ m.displayName }}</h1>
        <span class="muted">{{ m.email }}</span>
        @if (m.activeExperience) {
          <span class="badge" [style.background]="color(m.activeExperience)">
            {{ label(m.activeExperience) }}
          </span>
        }
      </div>

      <div class="grid">
        <section class="card">
          <h2>Données personnelles</h2>
          @if (editing()) {
            <div style="display:grid;gap:0.5rem;max-width:280px">
              <label class="muted" style="font-size:0.78rem">Nom affiché (nickname)</label>
              <input class="input" [(ngModel)]="draftName" placeholder="Nom affiché" />
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary" (click)="saveProfile()">Enregistrer</button>
                <button class="btn" (click)="editing.set(false)">Annuler</button>
              </div>
            </div>
          } @else {
            <p style="margin:0 0 0.3rem"><strong>{{ m.displayName }}</strong></p>
            <p class="muted" style="margin:0 0 0.6rem;font-size:0.85rem">
              {{ m.email }} <span class="muted">· e-mail de connexion</span>
            </p>
            <button class="btn" (click)="startEdit(m.displayName)">Modifier le nom affiché</button>
          }
        </section>

        <section class="card">
          <h2>Sécurité</h2>
          <div style="display:grid;gap:1rem;max-width:320px">
            <div style="display:grid;gap:0.4rem">
              <h3 style="font-size:0.85rem;margin:0">Changer le mot de passe</h3>
              <input class="input" type="password" [(ngModel)]="pwdCurrent"
                placeholder="Mot de passe actuel" autocomplete="current-password" />
              <input class="input" type="password" [(ngModel)]="pwdNew"
                placeholder="Nouveau mot de passe (8 caractères min.)" autocomplete="new-password" />
              <button class="btn" (click)="changePassword()" [disabled]="!pwdCurrent || pwdNew.length < 8">
                Changer le mot de passe
              </button>
            </div>
            <div style="display:grid;gap:0.4rem">
              <h3 style="font-size:0.85rem;margin:0">Changer l'adresse e-mail</h3>
              <input class="input" type="password" [(ngModel)]="emailPwd"
                placeholder="Mot de passe actuel" autocomplete="current-password" />
              <input class="input" type="email" [(ngModel)]="emailNew" placeholder="Nouvelle adresse" />
              <button class="btn" (click)="requestEmailChange()" [disabled]="!emailPwd || !emailNew">
                Envoyer le lien de confirmation
              </button>
              <p class="muted" style="margin:0;font-size:0.78rem">
                Un lien de confirmation sera envoyé à la nouvelle adresse ; l'ancienne reste valide
                jusqu'à confirmation.
              </p>
            </div>
            @if (securityMsg()) {
              <p style="margin:0;font-size:0.85rem">{{ securityMsg() }}</p>
            }
          </div>
        </section>

        <section class="card">
          <h2>Expériences disponibles</h2>
          <div class="chips">
            @for (exp of allExperiences; track exp) {
              @if (m.experiences.includes(exp)) {
                <span
                  class="chip exp"
                  [class.off]="m.activeExperience !== exp"
                  [style.background]="m.activeExperience === exp ? color(exp) : ''"
                >
                  {{ label(exp) }}
                </span>
              }
            }
          </div>
          <p class="muted" style="margin:0.75rem 0 0;font-size:0.8rem">
            Le changement d'expérience se fait dans la barre latérale. Il ne modifie jamais les
            permissions.
          </p>
        </section>

        <section class="card">
          <h2>Devenir organisateur</h2>
          <p class="muted" style="margin:0 0 0.75rem;font-size:0.85rem">
            Activez le mode organisateur pour créer et publier vos propres événements, en toute
            autonomie (sans organisation). L'expérience Organizer devient alors accessible depuis la
            barre latérale.
          </p>
          <label class="switch">
            <input
              type="checkbox"
              [checked]="isOrganizer()"
              [disabled]="organizerBusy()"
              (change)="toggleOrganizer($event)"
            />
            {{ isOrganizer() ? 'Mode organisateur activé' : 'Je suis organisateur' }}
          </label>
          @if (organizerMsg()) {
            <p style="margin:0.6rem 0 0;font-size:0.85rem">{{ organizerMsg() }}</p>
          }
        </section>

        <section class="card">
          <h2>Rôles</h2>
          <div class="chips">
            @for (role of m.roles; track role) {
              <span class="chip">{{ role }}</span>
            }
          </div>
        </section>

        <section class="card">
          <h2>Permissions effectives ({{ m.permissions.length }})</h2>
          @for (grp of permissionGroups(); track grp.group) {
            <div class="perm-group">
              <div class="g">{{ grp.group }}</div>
              <div class="chips">
                @for (key of grp.keys; track key) {
                  <span class="perm">{{ key }}</span>
                }
              </div>
            </div>
          }
        </section>

        <section class="card">
          <h2>Organisations</h2>
          @if (!m.organizations.length) {
            <p class="muted" style="font-size:0.85rem">Aucune organisation.</p>
          }
          @for (org of m.organizations; track org.id) {
            <div class="org" [class.active]="org.id === m.activeOrganizationId">
              <div class="org-head">
                <span class="org-name">{{ org.name }}</span>
                @if (org.subscription) {
                  <span class="sub">{{ org.subscription }}</span>
                }
              </div>
              <div class="chips">
                @for (role of org.roles; track role) {
                  <span class="chip">{{ role }}</span>
                }
              </div>
              <div style="margin-top:0.5rem">
                @if (org.id === m.activeOrganizationId) {
                  <span class="active-tag">● Organisation active</span>
                } @else {
                  <button class="btn" (click)="activate(org.id)">Activer ce contexte</button>
                }
              </div>
            </div>
          }
        </section>

        @if (canManageOrg() && m.activeOrganizationId) {
          <section class="card">
            <h2>Adresses de l'organisation</h2>
            <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
              Adresses de « {{ activeOrgName(m) }} ». Proposées comme localisation à la création d'un
              événement. La région est dérivée de la commune.
            </p>

            @for (a of addresses(); track a.id) {
              <div class="org">
                <div class="org-head">
                  <span class="org-name">
                    {{ a.label }}
                    @if (a.isPrimary) { <span class="active-tag">● principale</span> }
                  </span>
                </div>
                <div class="muted" style="font-size:0.84rem">
                  {{ a.streetLines }} · {{ a.postalCode }}
                  @if (a.municipalityName) { {{ a.municipalityName }} }
                  @if (a.regionName) { <span class="muted">({{ a.regionName }})</span> }
                  · {{ a.countryName }}
                </div>
                <div style="margin-top:0.5rem;display:flex;gap:0.5rem">
                  @if (!a.isPrimary) {
                    <button class="btn" (click)="setPrimary(m.activeOrganizationId!, a.id)">Définir principale</button>
                  }
                  <button class="btn" (click)="deleteAddress(m.activeOrganizationId!, a.id)">Supprimer</button>
                </div>
              </div>
            }
            @if (!addresses().length) {
              <p class="muted" style="font-size:0.85rem">Aucune adresse enregistrée.</p>
            }

            <div style="border-top:1px solid var(--border);margin-top:0.6rem;padding-top:0.7rem">
              <h3 style="font-size:0.85rem;margin:0 0 0.5rem">Ajouter une adresse</h3>
              <div style="display:grid;gap:0.5rem">
                <input class="input" [(ngModel)]="addr.label" placeholder="Libellé (ex. Boutique centre-ville)" />
                <input class="input" [(ngModel)]="addr.streetLines" placeholder="Rue" />
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
                  <select class="select" [(ngModel)]="addr.countryId" (ngModelChange)="onAddrCountryChange()">
                    <option value="">Pays…</option>
                    @for (c of countries; track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                  <div style="display:flex;gap:0.4rem">
                    <input class="input" [(ngModel)]="addr.postalCode" placeholder="Code postal"
                           [disabled]="!addr.countryId" (keyup.enter)="resolveAddr()" />
                    <button type="button" class="btn" [disabled]="!addr.countryId || !addr.postalCode.trim()"
                            (click)="resolveAddr()">Résoudre</button>
                  </div>
                </div>
                @if (addrResolved.length) {
                  <select class="select" [(ngModel)]="addr.municipalityId">
                    <option value="">Commune…</option>
                    @for (mun of addrResolved; track mun.id) {
                      <option [value]="mun.id">{{ mun.name }} ({{ mun.regionName }})</option>
                    }
                  </select>
                } @else if (addrPostalSearched) {
                  <p class="muted" style="font-size:0.8rem;margin:0">Aucune commune trouvée pour ce code postal.</p>
                }
                <label style="font-size:0.85rem;display:flex;gap:0.4rem;align-items:center">
                  <input type="checkbox" [(ngModel)]="addr.isPrimary" /> Adresse principale
                </label>
                <div>
                  <button class="btn btn-primary" [disabled]="!canSubmitAddr()"
                          (click)="addAddress(m.activeOrganizationId!)">Ajouter l'adresse</button>
                </div>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>IA de l'organisation</h2>
            <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
              IA appliquée aux imports réalisés au nom de « {{ activeOrgName(m) }} ». Prioritaire sur
              votre IA personnelle. La clé est stockée comme un secret.
            </p>
            <div style="display:grid;gap:0.5rem">
              <label class="switch"><input type="checkbox" [(ngModel)]="orgAi.enabled" /> Activer l'IA de l'organisation</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
                <select class="select" [(ngModel)]="orgAi.provider">
                  <option value="">Fournisseur…</option>
                  @for (p of aiProviders; track p.id) {
                    <option [value]="p.id">{{ p.label }}</option>
                  }
                </select>
                <input class="input" [(ngModel)]="orgAi.model" list="ai-models-org" placeholder="Modèle (vision)" />
                <datalist id="ai-models-org">
                  @for (m of modelsFor(orgAi.provider); track m) {
                    <option [value]="m"></option>
                  }
                </datalist>
              </div>
              <input class="input" type="password" [(ngModel)]="orgAi.apiKey"
                     [placeholder]="orgAiSecretMasked() ? 'Clé enregistrée (' + orgAiSecretMasked() + ') — vide = inchangée' : 'Clé API'" />
              @if (providerInfo(orgAi.provider); as pi) {
                <p class="muted" style="font-size:0.76rem;margin:0">
                  @if (pi.requiresKey) {
                    Clé {{ pi.keyHint }} —
                    @if (pi.keyUrl) {
                      <a [href]="pi.keyUrl" target="_blank" rel="noopener" style="color:var(--exp)">obtenir une clé ↗</a>
                    }
                  } @else {
                    {{ pi.keyHint }}
                  }
                </p>
              }
              <div class="chips">
                @for (uc of aiUseCases; track uc) {
                  <button type="button" class="theme-opt" [class.on]="orgAi.useCases[uc]" (click)="toggleOrgUseCase(uc)">{{ uc }}</button>
                }
              </div>
              <div style="display:flex;gap:0.5rem;align-items:center">
                <button class="btn btn-primary" (click)="saveOrgAi(m.activeOrganizationId!)">Enregistrer</button>
                <button class="btn" (click)="testOrgAi(m.activeOrganizationId!)" [disabled]="!orgAiSecretMasked()">Tester</button>
                @if (orgAiStatus()) { <span class="sub">{{ aiStatusLabelOf(orgAiStatus()) }}</span> }
              </div>
            </div>
          </section>
        }

        <section class="card">
          <h2>Configuration IA</h2>
          <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
            Branchez votre propre IA pour assister vos imports (OCR, traduction…). La clé est stockée
            comme un secret : jamais réaffichée. L'IA reste une assistance — la décision reste
            déterministe.
          </p>
          <div style="display:grid;gap:0.5rem">
            <label class="switch">
              <input type="checkbox" [(ngModel)]="ai.enabled" /> Activer l'IA
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
              <select class="select" [(ngModel)]="ai.provider">
                <option value="">Fournisseur…</option>
                @for (p of aiProviders; track p.id) {
                  <option [value]="p.id">{{ p.label }}</option>
                }
              </select>
              <input class="input" [(ngModel)]="ai.model" list="ai-models-perso" placeholder="Modèle (vision)" />
              <datalist id="ai-models-perso">
                @for (m of modelsFor(ai.provider); track m) {
                  <option [value]="m"></option>
                }
              </datalist>
            </div>
            <input class="input" type="password" [(ngModel)]="ai.apiKey"
                   [placeholder]="aiSecretMasked() ? 'Clé enregistrée (' + aiSecretMasked() + ') — laisser vide pour conserver' : 'Clé API'" />
            @if (providerInfo(ai.provider); as pi) {
              <p class="muted" style="font-size:0.76rem;margin:0">
                @if (pi.requiresKey) {
                  Clé {{ pi.keyHint }} —
                  @if (pi.keyUrl) {
                    <a [href]="pi.keyUrl" target="_blank" rel="noopener" style="color:var(--exp)">obtenir une clé ↗</a>
                  }
                } @else {
                  {{ pi.keyHint }}
                }
              </p>
            }
            <div>
              <div class="muted" style="font-size:0.76rem;margin-bottom:0.3rem">Cas d'usage autorisés</div>
              <div class="chips">
                @for (uc of aiUseCases; track uc) {
                  <button type="button" class="theme-opt" [class.on]="ai.useCases[uc]" (click)="toggleUseCase(uc)">
                    {{ uc }}
                  </button>
                }
              </div>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="btn btn-primary" (click)="saveAi()">Enregistrer</button>
              <button class="btn" (click)="testAi()" [disabled]="!aiSecretMasked()">Tester</button>
              @if (aiStatus()) {
                <span class="sub">{{ aiStatusLabel() }}</span>
              }
            </div>
          </div>
        </section>

        <section class="card">
          <h2>Autres préférences</h2>
          <label class="muted" style="font-size:0.78rem;display:block;margin-bottom:0.4rem">Thème</label>
          <div class="theme-opts">
            @for (opt of themeOptions; track opt.value) {
              <button
                type="button"
                class="theme-opt"
                [class.on]="themePreference() === opt.value"
                (click)="setTheme(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
          <p class="muted" style="font-size:0.78rem;margin:0.6rem 0 0">
            « Système » suit le réglage clair/sombre de votre appareil.
          </p>
        </section>

        <section class="card">
          <h2>Préférences de notification</h2>
          <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
            Choisissez les vecteurs de diffusion. L'application (in-app) reste toujours active :
            elle conserve l'historique consultable.
          </p>
          <div class="vecteurs">
            <div class="vec">
              <div>
                <div class="vec-name">In-app</div>
                <div class="muted" style="font-size:0.76rem">Historique — toujours actif</div>
              </div>
              <span class="pill on locked">Actif</span>
            </div>
            <div class="vec">
              <div>
                <div class="vec-name">E-mail</div>
                <div class="muted" style="font-size:0.76rem">Recevoir un e-mail</div>
              </div>
              <button
                type="button"
                class="pill"
                [class.on]="notifPref('email')"
                (click)="toggleNotif('email')"
              >
                {{ notifPref('email') ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
            <div class="vec">
              <div>
                <div class="vec-name">Push</div>
                <div class="muted" style="font-size:0.76rem">Notification poussée</div>
              </div>
              <button
                type="button"
                class="pill"
                [class.on]="notifPref('push')"
                (click)="toggleNotif('push')"
              >
                {{ notifPref('push') ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
          </div>
          <p class="muted" style="font-size:0.76rem;margin:0.7rem 0 0">
            Les fréquences (immédiat / récap quotidien / hebdomadaire) arriveront avec le moteur de
            notifications de la V3.
          </p>
        </section>

        <section class="card">
          <h2>Session</h2>
          @if (m.subscription) {
            <p style="margin:0 0 0.6rem">
              Souscription : <span class="sub">{{ m.subscription }}</span>
            </p>
          }
          <button class="btn" (click)="logout()">Se déconnecter</button>
        </section>
      </div>
    } @else {
      <p class="muted">Chargement de l'identité…</p>
    }
  `,
})
export class IdentityComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly aiConfigApi = inject(AiConfigApi);
  private readonly referenceData = inject(ReferenceDataApi);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Configuration IA personnelle (ADR.16 / TSPEC.07).
  readonly aiUseCases = AI_USE_CASES;
  aiProviders: AiProviderInfo[] = [];
  private readonly aiSecret = signal<{ masked: string } | null>(null);
  private readonly aiTestStatus = signal<string>('');
  ai = {
    provider: '',
    model: '',
    enabled: false,
    useCases: {} as Record<string, boolean>,
    apiKey: '',
  };

  // Configuration IA de l'organisation active (portée ORGANIZATION).
  private readonly orgAiSecret = signal<{ masked: string } | null>(null);
  private readonly orgAiTestStatus = signal<string>('');
  orgAi = {
    provider: '',
    model: '',
    enabled: false,
    useCases: {} as Record<string, boolean>,
    apiKey: '',
  };

  // Adresses de l'organisation active (chantier §8.2), si l'utilisateur peut la gérer.
  readonly addresses = signal<OrganizationAddress[]>([]);
  countries: ReferentialItem[] = [];
  addrResolved: MunicipalityGeo[] = [];
  addrPostalSearched = false;
  addr = { label: '', countryId: '', postalCode: '', municipalityId: '', streetLines: '', isPrimary: false };

  readonly allExperiences: Experience[] = ['EXPLORER', 'ORGANIZER', 'OPERATOR'];
  readonly me = this.identity.me;

  readonly themePreference = this.theme.preference;
  readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' },
  ];

  readonly initials = computed(() => toInitials(this.me()?.displayName || this.me()?.email || ''));

  readonly editing = signal(false);
  draftName = '';

  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const permissions = this.me()?.permissions ?? [];
    const byGroup = new Map<string, string[]>();
    for (const key of permissions) {
      const group = key.includes('.') ? key.split('.')[0] : 'autre';
      byGroup.set(group, [...(byGroup.get(group) ?? []), key]);
    }
    return [...byGroup.entries()]
      .map(([group, keys]) => ({ group, keys }))
      .sort((a, b) => a.group.localeCompare(b.group));
  });

  ngOnInit(): void {
    if (!this.me()) {
      this.identity.loadMe().subscribe(() => this.loadAddresses());
    } else {
      this.loadAddresses();
    }
    this.loadAiConfig();
  }

  // --- Configuration IA personnelle (ADR.16 / TSPEC.07) ---

  providerInfo(id: string): AiProviderInfo | undefined {
    return this.aiProviders.find((p) => p.id === id);
  }

  modelsFor(id: string): string[] {
    return this.providerInfo(id)?.suggestedModels ?? [];
  }

  private loadAiConfig(): void {
    if (!this.aiProviders.length) {
      this.aiConfigApi.providers().subscribe((providers) => (this.aiProviders = providers));
    }
    this.aiConfigApi.get().subscribe((config) => {
      if (config) {
        this.ai.provider = config.provider;
        this.ai.model = config.model;
        this.ai.enabled = config.enabled;
        this.ai.useCases = { ...config.useCases };
        this.aiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.aiTestStatus.set(config.status);
      }
    });
  }

  aiSecretMasked(): string {
    return this.aiSecret()?.masked ?? '';
  }

  aiStatus(): string {
    return this.aiTestStatus();
  }

  aiStatusLabel(): string {
    return this.aiStatusLabelOf(this.aiTestStatus());
  }

  aiStatusLabelOf(status: string): string {
    const map: Record<string, string> = {
      CONFIGURED: 'Configuré (non testé)',
      TESTED: '✓ Testé',
      FAILED: '✗ Test échoué',
    };
    return map[status] ?? status;
  }

  // --- IA de l'organisation active ---

  private loadOrgAi(organizationId: string): void {
    this.aiConfigApi.getOrg(organizationId).subscribe((config) => {
      if (config) {
        this.orgAi.provider = config.provider;
        this.orgAi.model = config.model;
        this.orgAi.enabled = config.enabled;
        this.orgAi.useCases = { ...config.useCases };
        this.orgAiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.orgAiTestStatus.set(config.status);
      }
    });
  }

  orgAiSecretMasked(): string {
    return this.orgAiSecret()?.masked ?? '';
  }

  orgAiStatus(): string {
    return this.orgAiTestStatus();
  }

  toggleOrgUseCase(useCase: AiUseCase): void {
    this.orgAi.useCases = { ...this.orgAi.useCases, [useCase]: !this.orgAi.useCases[useCase] };
  }

  saveOrgAi(organizationId: string): void {
    this.aiConfigApi
      .updateOrg(organizationId, {
        provider: this.orgAi.provider.trim(),
        model: this.orgAi.model.trim(),
        enabled: this.orgAi.enabled,
        useCases: this.orgAi.useCases,
        apiKey: this.orgAi.apiKey.trim() || undefined,
      })
      .subscribe((config) => {
        this.orgAi.apiKey = '';
        this.orgAiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.orgAiTestStatus.set(config.status);
      });
  }

  testOrgAi(organizationId: string): void {
    this.aiConfigApi.testOrg(organizationId).subscribe((result) => this.orgAiTestStatus.set(result.status));
  }

  toggleUseCase(useCase: AiUseCase): void {
    this.ai.useCases = { ...this.ai.useCases, [useCase]: !this.ai.useCases[useCase] };
  }

  saveAi(): void {
    this.aiConfigApi
      .update({
        provider: this.ai.provider.trim(),
        model: this.ai.model.trim(),
        enabled: this.ai.enabled,
        useCases: this.ai.useCases,
        apiKey: this.ai.apiKey.trim() || undefined,
      })
      .subscribe((config) => {
        this.ai.apiKey = '';
        this.aiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.aiTestStatus.set(config.status);
      });
  }

  testAi(): void {
    this.aiConfigApi.test().subscribe((result) => this.aiTestStatus.set(result.status));
  }

  // --- Adresses de l'organisation active (chantier §8.2) ---

  canManageOrg(): boolean {
    return this.me()?.permissions.includes('organization.manage') ?? false;
  }

  activeOrgName(me: { organizations: { id: string; name: string }[]; activeOrganizationId: string | null }): string {
    return me.organizations.find((o) => o.id === me.activeOrganizationId)?.name ?? '';
  }

  private loadAddresses(): void {
    const me = this.me();
    if (!me || !this.canManageOrg() || !me.activeOrganizationId) {
      return;
    }
    if (!this.countries.length) {
      this.referenceData.countries().subscribe((items) => (this.countries = items));
    }
    this.identity
      .listOrganizationAddresses(me.activeOrganizationId)
      .subscribe((addresses) => this.addresses.set(addresses));
    this.loadOrgAi(me.activeOrganizationId);
  }

  onAddrCountryChange(): void {
    this.addr.postalCode = '';
    this.addr.municipalityId = '';
    this.addrResolved = [];
    this.addrPostalSearched = false;
  }

  resolveAddr(): void {
    const postalCode = this.addr.postalCode.trim();
    if (!this.addr.countryId || !postalCode) {
      return;
    }
    this.referenceData.resolveMunicipalities(this.addr.countryId, postalCode).subscribe((communes) => {
      this.addrResolved = communes;
      this.addrPostalSearched = true;
      this.addr.municipalityId = communes.length === 1 ? communes[0].id : '';
    });
  }

  canSubmitAddr(): boolean {
    return (
      this.addr.label.trim().length > 0 &&
      this.addr.streetLines.trim().length > 0 &&
      this.addr.countryId.length > 0 &&
      this.addr.postalCode.trim().length > 0
    );
  }

  addAddress(organizationId: string): void {
    if (!this.canSubmitAddr()) {
      return;
    }
    this.identity
      .createOrganizationAddress(organizationId, {
        label: this.addr.label.trim(),
        countryId: this.addr.countryId,
        postalCode: this.addr.postalCode.trim(),
        municipalityId: this.addr.municipalityId || undefined,
        streetLines: this.addr.streetLines.trim(),
        isPrimary: this.addr.isPrimary,
      })
      .subscribe(() => {
        this.addr = { label: '', countryId: '', postalCode: '', municipalityId: '', streetLines: '', isPrimary: false };
        this.addrResolved = [];
        this.addrPostalSearched = false;
        this.loadAddresses();
      });
  }

  setPrimary(organizationId: string, addressId: string): void {
    this.identity
      .setPrimaryOrganizationAddress(organizationId, addressId)
      .subscribe(() => this.loadAddresses());
  }

  deleteAddress(organizationId: string, addressId: string): void {
    this.identity
      .deleteOrganizationAddress(organizationId, addressId)
      .subscribe(() => this.loadAddresses());
  }

  label(experience: Experience): string {
    return EXPERIENCE_LABELS[experience];
  }

  color(experience: Experience): string {
    return EXPERIENCE_COLORS[experience];
  }

  activate(organizationId: string): void {
    this.identity.switchOrganization(organizationId).subscribe(() => this.loadAddresses());
  }

  startEdit(currentName: string): void {
    this.draftName = currentName;
    this.editing.set(true);
  }

  saveProfile(): void {
    const displayName = this.draftName.trim();
    if (!displayName) {
      return;
    }
    this.identity.updateProfile({ displayName }).subscribe(() => this.editing.set(false));
  }

  // --- Sécurité du compte (FSPEC.18) ---
  pwdCurrent = '';
  pwdNew = '';
  emailPwd = '';
  emailNew = '';
  readonly securityMsg = signal('');
  private readonly account = inject(AccountApi);

  changePassword(): void {
    this.account.changePassword(this.pwdCurrent, this.pwdNew).subscribe({
      next: () => {
        this.pwdCurrent = '';
        this.pwdNew = '';
        this.securityMsg.set('✅ Mot de passe modifié.');
      },
      error: (err) =>
        this.securityMsg.set(err?.error?.message ?? 'Échec du changement de mot de passe.'),
    });
  }

  requestEmailChange(): void {
    this.account.requestEmailChange(this.emailPwd, this.emailNew).subscribe({
      next: () => {
        this.securityMsg.set(`✅ Lien de confirmation envoyé à ${this.emailNew}.`);
        this.emailPwd = '';
        this.emailNew = '';
      },
      error: (err) =>
        this.securityMsg.set(err?.error?.message ?? "Échec de la demande de changement d'adresse."),
    });
  }

  // --- Mode organisateur autonome (self-service) ---
  readonly organizerBusy = signal(false);
  readonly organizerMsg = signal('');
  /** L'utilisateur a-t-il le rôle organisateur autonome ? (indépendant d'une appartenance à une org). */
  readonly isOrganizer = computed(() => (this.me()?.roles ?? []).includes('Organisateur autonome'));

  toggleOrganizer(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.organizerBusy.set(true);
    this.organizerMsg.set('');
    this.identity.setOrganizerMode(enabled).subscribe({
      next: () => {
        this.organizerBusy.set(false);
        this.organizerMsg.set(
          enabled
            ? '✅ Mode organisateur activé — l\'expérience Organizer est disponible dans la barre latérale.'
            : 'Mode organisateur désactivé.',
        );
      },
      error: (err) => {
        this.organizerBusy.set(false);
        this.organizerMsg.set(err?.error?.message ?? 'Action impossible pour le moment.');
      },
    });
  }

  /** État courant d'un vecteur de notification (lu depuis les préférences renvoyées par /me). */
  notifPref(channel: 'email' | 'push'): boolean {
    const notifications = (this.me()?.preferences?.['notifications'] ?? {}) as Record<string, unknown>;
    return notifications[channel] === true;
  }

  /** Active/désactive un vecteur ; honoré directement par le dispatcher de notifications. */
  toggleNotif(channel: 'email' | 'push'): void {
    const current = (this.me()?.preferences?.['notifications'] ?? {}) as Record<string, unknown>;
    const notifications = { ...current, [channel]: !this.notifPref(channel) };
    const preferences = { ...(this.me()?.preferences ?? {}), notifications };
    this.identity.updateProfile({ preferences }).subscribe();
  }

  setTheme(preference: ThemePreference): void {
    // Application immédiate (rendu) + persistance dans les préférences (User Preferences, ADR.20).
    this.theme.set(preference);
    const preferences = { ...(this.me()?.preferences ?? {}), theme: preference };
    this.identity.updateProfile({ preferences }).subscribe();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/welcome']);
  }
}
