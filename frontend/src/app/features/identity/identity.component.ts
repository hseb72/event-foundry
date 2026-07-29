import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountApi, SecurityEventDto } from '../../core/api/account.service';
import { IdentityService } from '../../core/api/identity.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { NotificationsApi } from '../../core/api/notifications.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';
import {
  AI_USE_CASES,
  AiProviderInfo,
  AiUseCase,
  Experience,
  NotificationPreferences,
  ThemePreference,
} from '../../core/models';
import { toInitials } from '../../shared/initials';
import { ExpandableCardComponent } from '../../shared/expandable-card.component';

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
  imports: [FormsModule, DatePipe, ExpandableCardComponent],
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

      /* Onglets de configuration (mêmes codes que les autres barres d'onglets de l'app). */
      .tabs { display: flex; flex-wrap: wrap; gap: 0.3rem; background: var(--surface-2); border-radius: 12px; padding: 0.25rem; width: fit-content; margin-bottom: 1rem; }
      .tabs button { border: 0; background: transparent; color: var(--muted); border-radius: 9px; padding: 0.4rem 0.9rem; font-weight: 600; }
      .tabs button.on { background: var(--exp); color: var(--exp-contrast, #fff); }
      /* Fiche descriptive (libellé / valeur) des données personnelles. */
      .facts { display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.9rem; margin: 0 0 0.8rem; font-size: 0.88rem; }
      .facts dt { color: var(--muted); }
      .facts dd { margin: 0; }
      .facts-inline { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem; }
      /* Fonctionnalité annoncée mais non encore disponible : signalée, jamais simulée. */
      .todo { font-size: 0.72rem; font-weight: 700; color: var(--orange, #b45309); }
      .todo-box { background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 0.55rem 0.8rem; font-size: 0.8rem; margin: 0.8rem 0 0; color: var(--muted); }
      .prefs { width: 100%; border-collapse: collapse; }
      .prefs th, .prefs td { text-align: left; padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--border); font-size: 0.86rem; }
      .prefs th { color: var(--muted); font-weight: 600; }
      .dt-wrap { overflow-x: auto; }
      /* Carte d'organisation : cerclée de vert si active, d'orange sinon. */
      .org-card { border: 2px solid var(--orange, #f97316); border-radius: 12px; padding: 0.8rem 0.9rem; background: var(--surface); }
      .org-card.active { border-color: var(--green, #16a34a); }
      .inactive-tag { color: var(--orange, #b45309); font-size: 0.82rem; font-weight: 600; }
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

      <!-- Onglets de configuration : un thème par onglet, dans un ordre stable. -->
      <div class="tabs" role="tablist" aria-label="Configuration">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" [class.on]="tab() === t.key"
                  [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)">
            {{ t.label }}
          </button>
        }
      </div>

      <!-- ================= PERSONNEL ================= -->
      @if (tab() === 'personal') {
        <div class="grid">
          <app-expandable-card cardTitle="Données personnelles">
            @if (editing()) {
              <div style="display:grid;gap:0.5rem;max-width:280px">
                <label class="muted" style="font-size:0.78rem">Pseudo (nom affiché)</label>
                <input class="input" [(ngModel)]="draftName" placeholder="Pseudo" />
                <div style="display:flex;gap:0.5rem">
                  <button class="btn btn-primary" (click)="saveProfile()">Enregistrer</button>
                  <button class="btn" (click)="editing.set(false)">Annuler</button>
                </div>
              </div>
            } @else {
              <dl class="facts">
                <dt>Pseudo</dt>
                <dd><strong>{{ m.displayName }}</strong></dd>
                <dt>E-mail de connexion</dt>
                <dd class="muted">{{ m.email }}</dd>
                <dt>Date de naissance</dt>
                <dd class="muted">— <span class="todo">à venir</span></dd>
                <dt>Adresse principale</dt>
                <dd class="muted">— <span class="todo">à venir</span></dd>
              </dl>
              <button class="btn" (click)="startEdit(m.displayName)">Modifier le pseudo</button>
            }
          </app-expandable-card>

          <app-expandable-card cardTitle="Adresses supplémentaires">
            <p class="muted" style="font-size:0.82rem;margin:0">
              Enregistrez des adresses de référence pour cibler vos recherches autour d'un lieu
              précis (domicile, travail, résidence secondaire…).
            </p>
            <p class="todo-box">
              <strong>À venir</strong> — les adresses personnelles ne sont pas encore stockées :
              seul le modèle d'adresse d'organisation existe aujourd'hui. Nécessite un référentiel
              d'adresses utilisateur côté serveur (voir note de livraison).
            </p>
          </app-expandable-card>

          <app-expandable-card cardTitle="Sécurité">
            <div style="display:grid;gap:1rem;max-width:340px">
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
              <div style="display:grid;gap:0.4rem">
                <h3 style="font-size:0.85rem;margin:0">Authentification à deux facteurs (2FA)</h3>
                @if (mfaEnabled()) {
                  <p class="muted" style="margin:0;font-size:0.82rem">✅ 2FA activée (application d'authentification).</p>
                  <input class="input" type="password" [(ngModel)]="mfaDisablePwd" placeholder="Mot de passe actuel" autocomplete="current-password" />
                  <button class="btn" (click)="disableMfa()" [disabled]="!mfaDisablePwd">Désactiver la 2FA</button>
                } @else if (mfaSecret()) {
                  <p class="muted" style="margin:0;font-size:0.82rem">
                    <strong>Confirmer l'activation</strong> — ajoutez ce compte à votre application
                    d'authentification, puis saisissez le code généré.
                  </p>
                  <code style="font-size:0.8rem;word-break:break-all">{{ mfaSecret() }}</code>
                  <input class="input" [(ngModel)]="mfaCode" placeholder="Code à 6 chiffres" />
                  <button class="btn btn-primary" (click)="enableMfa()" [disabled]="mfaCode.length < 6">Confirmer</button>
                } @else if (mfaRecovery().length) {
                  <p style="margin:0;font-size:0.82rem">✅ 2FA activée. Conservez vos codes de récupération :</p>
                  <div style="display:flex;flex-wrap:wrap;gap:0.4rem">
                    @for (c of mfaRecovery(); track c) { <code style="font-size:0.8rem">{{ c }}</code> }
                  </div>
                } @else {
                  <label class="muted" style="font-size:0.78rem">Méthode</label>
                  <div class="chips">
                    @for (opt of mfaMethods; track opt.value) {
                      <button type="button" class="theme-opt" [class.on]="mfaMethod === opt.value"
                              [disabled]="!opt.available" [title]="opt.available ? '' : 'À venir'"
                              (click)="mfaMethod = opt.value">
                        {{ opt.label }}{{ opt.available ? '' : ' (à venir)' }}
                      </button>
                    }
                  </div>
                  <button class="btn" (click)="setupMfa()">Activer la 2FA</button>
                }
              </div>
              @if (securityMsg()) {
                <p style="margin:0;font-size:0.85rem">{{ securityMsg() }}</p>
              }
            </div>
          </app-expandable-card>

          <app-expandable-card cardTitle="Données RGPD">
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
              <button class="btn" (click)="exportData()" [disabled]="rgpdBusy()">
                Exporter mes données (JSON)
              </button>
              <button class="btn" (click)="loadSecurityEvents()" [disabled]="rgpdBusy()">
                Journal de sécurité
              </button>
            </div>
            @if (securityEvents(); as events) {
              <ul style="margin:0.9rem 0 0;padding-left:1rem;font-size:0.82rem;max-height:200px;overflow:auto">
                @for (ev of events; track ev.id) {
                  <li>
                    <strong>{{ securityLabel(ev.type) }}</strong>
                    <span class="muted"> · {{ ev.occurredAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </li>
                } @empty {
                  <li class="muted">Aucun événement de sécurité.</li>
                }
              </ul>
            }

            <hr style="border:none;border-top:1px solid var(--border);margin:1rem 0" />
            <h3 style="font-size:0.9rem;margin:0 0 0.4rem;color:var(--red)">Supprimer mon compte</h3>
            <p class="muted" style="margin:0 0 0.6rem;font-size:0.82rem">
              Action irréversible : vos données personnelles sont effacées (anonymisation). Les
              historiques nécessaires à l'intégrité de la plateforme sont conservés de façon anonyme.
            </p>
            <div style="display:grid;gap:0.4rem;max-width:320px">
              <input class="input" type="password" [(ngModel)]="deletePwd"
                placeholder="Mot de passe actuel" autocomplete="current-password" />
              <button class="btn" style="border-color:var(--red);color:var(--red)"
                (click)="deleteAccount()" [disabled]="!deletePwd || rgpdBusy()">
                Supprimer définitivement mon compte
              </button>
            </div>
            @if (rgpdMsg()) {
              <p style="margin:0.6rem 0 0;font-size:0.85rem">{{ rgpdMsg() }}</p>
            }
          </app-expandable-card>

          <app-expandable-card cardTitle="Session">
            @if (m.subscription) {
              <p style="margin:0 0 0.6rem">
                Souscription : <span class="sub">{{ m.subscription }}</span>
              </p>
            }
            <button class="btn" (click)="logout()">Se déconnecter</button>
          </app-expandable-card>
        </div>
      }

      <!-- ================= NOTIFICATIONS ================= -->
      @if (tab() === 'notifications') {
        <div class="grid">
          <app-expandable-card cardTitle="Préférences de notifications">
            <p class="muted" style="font-size:0.82rem;margin:0 0 0.7rem">
              Pour chaque piste, choisissez le vecteur de diffusion. L'in-app reste toujours actif :
              il conserve l'historique consultable.
            </p>
            <div class="dt-wrap">
              <table class="prefs">
                <thead>
                  <tr><th>Piste</th><th>Fréquence</th><th>Méthode</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Historique</td>
                    <td class="muted">Temps réel</td>
                    <td><span class="pill on locked">In-app (toujours actif)</span></td>
                  </tr>
                  @for (ft of frequencyTracks; track ft.value) {
                    <tr>
                      <td>{{ ft.label }}</td>
                      <td class="muted">{{ ft.frequency }}</td>
                      <td>
                        <select class="select" [ngModel]="vectorFor(ft.value)"
                                (ngModelChange)="setVector(ft.value, $event)" style="max-width:180px">
                          @for (v of vectorOptions; track v.value) {
                            <option [value]="v.value">{{ v.label }}</option>
                          }
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="todo-box">
              <strong>À venir</strong> — le réglage <em>par type de notification</em> (une ligne par
              type) suppose des préférences typées côté serveur ; aujourd'hui le réglage porte sur la
              piste de fréquence, qui s'applique à tous les types.
            </p>
          </app-expandable-card>
        </div>
      }

      <!-- ================= PRÉFÉRENCES UI ================= -->
      @if (tab() === 'ui') {
        <div class="grid">
          <app-expandable-card cardTitle="Styles">
            <p class="muted" style="font-size:0.82rem;margin:0">
              Personnalisation du thème de l'interface parmi un choix d'ensembles de couleurs
              prédéfinis.
            </p>
            <p class="todo-box"><strong>Prochaine version.</strong></p>
          </app-expandable-card>

          <app-expandable-card cardTitle="Lumière">
            <div class="theme-opts">
              @for (opt of themeOptions; track opt.value) {
                <button type="button" class="theme-opt" [class.on]="themePreference() === opt.value"
                        (click)="setTheme(opt.value)">
                  {{ opt.label }}
                </button>
              }
            </div>
            <p class="muted" style="font-size:0.78rem;margin:0.6rem 0 0">
              « Système » suit le réglage clair/sombre de votre appareil.
            </p>
          </app-expandable-card>
        </div>
      }

      <!-- ================= UTILISATION IA ================= -->
      @if (tab() === 'ai') {
        <div class="grid">
          <app-expandable-card cardTitle="Configuration des IA">
            <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
              Branchez votre propre IA pour assister vos imports (OCR, traduction…). La clé est
              stockée chiffrée comme un secret : jamais réaffichée. L'IA reste une assistance — la
              décision métier demeure déterministe.
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
                <select class="select" [(ngModel)]="ai.model">
                  <option value="">Modèle…</option>
                  @for (mo of modelsFor(ai.provider); track mo) {
                    <option [value]="mo">{{ mo }}</option>
                  }
                </select>
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
              <div style="display:flex;gap:0.5rem;align-items:center">
                <button class="btn btn-primary" (click)="saveAi()">Enregistrer</button>
                <button class="btn" (click)="testAi()" [disabled]="!aiSecretMasked()">Tester</button>
                @if (aiStatus()) {
                  <span class="sub">{{ aiStatusLabel() }}</span>
                }
              </div>
            </div>
            <p class="todo-box">
              <strong>À venir</strong> — plusieurs comptes IA nommés (CRUD). Le modèle actuel ne
              stocke <em>qu'une</em> configuration par utilisateur.
            </p>
          </app-expandable-card>

          <app-expandable-card cardTitle="Autorisation d'usage">
            <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
              Cas d'usage pour lesquels votre IA est autorisée. Un cas non coché n'appelle jamais
              l'IA.
            </p>
            <div class="dt-wrap">
              <table class="prefs">
                <thead><tr><th>Cas d'usage</th><th>IA utilisée</th></tr></thead>
                <tbody>
                  @for (uc of aiUseCases; track uc) {
                    <tr>
                      <td>{{ uc }}</td>
                      <td>
                        <select class="select" [ngModel]="ai.useCases[uc] ? 'mine' : 'none'"
                                (ngModelChange)="setUseCase(uc, $event)" style="max-width:200px">
                          <option value="none">Aucune</option>
                          <option value="mine">Mon IA{{ ai.provider ? ' (' + ai.provider + ')' : '' }}</option>
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div style="margin-top:0.6rem">
              <button class="btn btn-primary" (click)="saveAi()">Enregistrer les autorisations</button>
            </div>
          </app-expandable-card>
        </div>
      }

      <!-- ================= RÔLES & PERMISSIONS ================= -->
      @if (tab() === 'roles') {
        <div class="grid">
          <app-expandable-card cardTitle="Devenir organisateur">
            <p class="muted" style="margin:0 0 0.75rem;font-size:0.85rem">
              Activez le mode organisateur pour créer et publier vos propres événements, en toute
              autonomie (sans organisation). L'expérience Organizer devient alors accessible depuis
              la barre latérale.
            </p>
            <label class="switch">
              <input type="checkbox" [checked]="isOrganizer()" [disabled]="organizerBusy()"
                     (change)="toggleOrganizer($event)" />
              {{ isOrganizer() ? 'Mode organisateur activé' : 'Je suis organisateur' }}
            </label>
            @if (organizerMsg()) {
              <p style="margin:0.6rem 0 0;font-size:0.85rem">{{ organizerMsg() }}</p>
            }
          </app-expandable-card>

          <app-expandable-card cardTitle="Expériences disponibles">
            <div class="chips">
              @for (exp of allExperiences; track exp) {
                @if (m.experiences.includes(exp)) {
                  <span class="chip exp" [class.off]="m.activeExperience !== exp"
                        [style.background]="m.activeExperience === exp ? color(exp) : ''">
                    {{ label(exp) }}
                  </span>
                }
              }
            </div>
            <p class="muted" style="margin:0.75rem 0 0;font-size:0.8rem">
              Le changement d'expérience se fait dans la barre latérale. Il ne modifie jamais les
              permissions.
            </p>
          </app-expandable-card>

          <app-expandable-card cardTitle="Rôles">
            <div class="chips">
              @for (role of m.roles; track role) {
                <span class="chip">{{ role }}</span>
              }
            </div>
          </app-expandable-card>

          <app-expandable-card [cardTitle]="'Permissions effectives (' + m.permissions.length + ')'">
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
          </app-expandable-card>
        </div>
      }

      <!-- ================= ORGANISATIONS ================= -->
      @if (tab() === 'orgs') {
        <p class="muted" style="font-size:0.82rem;margin:0 0 0.8rem">
          Les réglages propres à une organisation (adresses, IA, informations générales) se
          configurent depuis <strong>Mes organisations</strong>, dans l'expérience Organizer.
        </p>
        @if (!m.organizations.length) {
          <p class="muted">Aucune organisation.</p>
        }
        <div class="grid">
          @for (org of m.organizations; track org.id) {
            <div class="org-card" [class.active]="org.id === m.activeOrganizationId">
              <div class="org-head">
                <span class="org-name">{{ org.name }}</span>
                @if (org.subscription) {
                  <span class="sub">{{ org.subscription }}</span>
                }
              </div>
              <div class="facts-inline">
                <span class="muted">Rôle :</span>
                <span class="chips">
                  @for (role of org.roles; track role) {
                    <span class="chip">{{ role }}</span>
                  } @empty {
                    <span class="muted">—</span>
                  }
                </span>
              </div>
              <div style="margin-top:0.5rem">
                @if (org.id === m.activeOrganizationId) {
                  <span class="active-tag">● Organisation active</span>
                } @else {
                  <span class="inactive-tag">○ Inactive</span>
                  <button class="btn btn-sm" style="margin-left:0.5rem" (click)="activate(org.id)">Activer</button>
                }
              </div>
            </div>
          }
        </div>
      }
    } @else {
      <p class="muted">Chargement de l'identité…</p>
    }
  `,
})
export class IdentityComponent implements OnInit {
  /** Onglets de la configuration, dans l'ordre d'affichage. */
  readonly tabs = [
    { key: 'personal', label: 'Personnel' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'ui', label: 'Préférences UI' },
    { key: 'ai', label: 'Utilisation IA' },
    { key: 'roles', label: 'Rôles & permissions' },
    { key: 'orgs', label: 'Organisations' },
  ] as const;
  readonly tab = signal<'personal' | 'notifications' | 'ui' | 'ai' | 'roles' | 'orgs'>('personal');

  /** Méthodes de second facteur. Seule l'application d'authentification est disponible à ce jour. */
  readonly mfaMethods = [
    { value: 'totp', label: 'Application d’authentification', available: true },
    { value: 'email', label: 'Code par e-mail', available: false },
    { value: 'push', label: 'Code en push', available: false },
  ];
  mfaMethod = 'totp';

  /** Pistes de fréquence réglables (le vecteur in-app est toujours actif, non réglable). */
  readonly frequencyTracks = [
    { value: 'immediate' as const, label: 'Alertes immédiates', frequency: 'Immédiate' },
    { value: 'daily' as const, label: 'Récapitulatif quotidien', frequency: 'Quotidienne' },
    { value: 'weekly' as const, label: 'Récapitulatif hebdomadaire', frequency: 'Hebdomadaire' },
  ];
  readonly vectorOptions = [
    { value: 'none', label: 'Aucune' },
    { value: 'email', label: 'E-mail' },
    { value: 'push', label: 'Push' },
  ];
  /** Préférences de notification servies par l'API (jamais dérivées du blob de préférences UI). */
  readonly notifPrefs = signal<NotificationPreferences | null>(null);
  private readonly identity = inject(IdentityService);
  private readonly aiConfigApi = inject(AiConfigApi);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsApi);

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

  // Adresses et IA **de l'organisation** ne vivent pas ici : ce sont des réglages rattachés à une
  // organisation, gérés dans « Mes organisations » → Configuration (FSPEC.19 / ADR.16).

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
      this.identity.loadMe().subscribe();
    }
    this.loadAiConfig();
    this.loadMfa();
    this.notificationsApi.getPreferences().subscribe((prefs) => this.notifPrefs.set(prefs));
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

  label(experience: Experience): string {
    return EXPERIENCE_LABELS[experience];
  }

  color(experience: Experience): string {
    return EXPERIENCE_COLORS[experience];
  }

  activate(organizationId: string): void {
    this.identity.switchOrganization(organizationId).subscribe();
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

  // --- MFA (FSPEC.18 §MFA) ---
  readonly mfaEnabled = signal(false);
  readonly mfaSecret = signal('');
  readonly mfaRecovery = signal<string[]>([]);
  mfaCode = '';
  mfaDisablePwd = '';

  private loadMfa(): void {
    this.account.mfaStatus().subscribe((s) => this.mfaEnabled.set(s.enabled));
  }

  setupMfa(): void {
    this.account.mfaSetup().subscribe((r) => this.mfaSecret.set(r.secret));
  }

  enableMfa(): void {
    this.account.mfaEnable(this.mfaCode).subscribe({
      next: (r) => {
        this.mfaSecret.set('');
        this.mfaCode = '';
        this.mfaRecovery.set(r.recoveryCodes);
        this.mfaEnabled.set(true);
      },
      error: (err) => this.securityMsg.set(err?.error?.message ?? 'Code invalide.'),
    });
  }

  disableMfa(): void {
    this.account.mfaDisable(this.mfaDisablePwd).subscribe({
      next: () => {
        this.mfaEnabled.set(false);
        this.mfaRecovery.set([]);
        this.mfaDisablePwd = '';
        this.securityMsg.set('2FA désactivée.');
      },
      error: (err) => this.securityMsg.set(err?.error?.message ?? 'Échec de la désactivation.'),
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

  // --- Données personnelles / RGPD (FSPEC.18 §14) ---
  readonly rgpdBusy = signal(false);
  readonly rgpdMsg = signal('');
  readonly securityEvents = signal<SecurityEventDto[] | null>(null);
  deletePwd = '';

  private static readonly SECURITY_LABELS: Record<string, string> = {
    'account.created': 'Création du compte',
    'account.email_verified': 'Adresse e-mail vérifiée',
    'account.email_verification_sent': 'Lien de vérification envoyé',
    'auth.login_succeeded': 'Connexion réussie',
    'auth.login_failed': 'Échec de connexion',
    'account.password_changed': 'Mot de passe changé',
    'account.password_reset_requested': 'Récupération demandée',
    'account.password_reset_completed': 'Mot de passe réinitialisé',
    'account.email_change_requested': "Changement d'adresse demandé",
    'account.email_changed': "Adresse e-mail changée",
    'account.suspended': 'Compte suspendu',
    'account.reactivated': 'Compte réactivé',
    'account.data_exported': 'Export de données',
    'account.deleted': 'Suppression du compte',
  };

  securityLabel(type: string): string {
    return IdentityComponent.SECURITY_LABELS[type] ?? type;
  }

  exportData(): void {
    this.rgpdBusy.set(true);
    this.account.exportData().subscribe({
      next: (data) => {
        this.rgpdBusy.set(false);
        // Téléchargement d'un fichier JSON local (aucune donnée n'est envoyée à un tiers).
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'eventfoundry-mes-donnees.json';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set('Export impossible pour le moment.');
      },
    });
  }

  loadSecurityEvents(): void {
    this.rgpdBusy.set(true);
    this.account.securityEvents().subscribe({
      next: (events) => {
        this.rgpdBusy.set(false);
        this.securityEvents.set(events);
      },
      error: () => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set('Journal indisponible pour le moment.');
      },
    });
  }

  deleteAccount(): void {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) {
      return;
    }
    this.rgpdBusy.set(true);
    this.account.deleteAccount(this.deletePwd).subscribe({
      next: () => {
        // Compte anonymisé : on ferme la session et on renvoie vers la vitrine publique.
        this.auth.logout();
        void this.router.navigate(['/welcome']);
      },
      error: (err) => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set(err?.error?.message ?? 'Suppression impossible (mot de passe incorrect ?).');
      },
    });
  }

  /** État courant d'un vecteur de notification (lu depuis les préférences renvoyées par /me). */
  /** Vecteur courant d'une piste de fréquence (préférences servies par l'API notifications). */
  vectorFor(track: 'immediate' | 'daily' | 'weekly'): string {
    return this.notifPrefs()?.[track] ?? 'none';
  }

  /**
   * Change le vecteur d'une piste. Les préférences sont **persistées côté serveur** (FSPEC.04) :
   * l'in-app reste toujours actif et n'est pas réglable ici.
   */
  setVector(track: 'immediate' | 'daily' | 'weekly', vector: string): void {
    const current = this.notifPrefs() ?? { immediate: 'none', daily: 'none', weekly: 'none' };
    const next = { ...current, [track]: vector } as NotificationPreferences;
    this.notifPrefs.set(next);
    this.notificationsApi.updatePreferences(next).subscribe({
      next: (saved) => this.notifPrefs.set(saved),
    });
  }

  /**
   * Autorise (ou non) l'IA pour un cas d'usage. Une seule configuration IA existe aujourd'hui :
   * le choix se limite donc à « Aucune » ou « Mon IA ».
   */
  setUseCase(useCase: AiUseCase, choice: string): void {
    this.ai.useCases[useCase] = choice === 'mine';
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
