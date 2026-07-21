import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImportsApi } from '../../core/api/imports.service';
import { ImportResponse } from '../../core/models';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .grid {
        display: grid;
        gap: 1.25rem;
        max-width: 640px;
      }
      .drop {
        border: 2px dashed var(--border);
        border-radius: var(--radius);
        padding: 1.5rem;
        text-align: center;
        color: var(--muted);
      }
      textarea {
        min-height: 140px;
        resize: vertical;
      }
      .result {
        border-left: 4px solid var(--exp);
      }
      .ok {
        color: var(--green);
        font-weight: 600;
      }
    `,
  ],
  template: `
    <h1>Importer un événement</h1>
    <p class="muted">
      Déposez une affiche ou collez un texte : le pipeline OCR + moteur expert propose un
      événement à valider.
    </p>

    <div class="grid">
      <div class="card">
        <h3>Depuis un document</h3>
        <div class="drop">
          <input type="file" accept="image/png,image/jpeg,application/pdf" (change)="onFile($event)" />
          <p>JPG, PNG ou PDF (max ~20 Mo)</p>
        </div>
        <label style="display:flex;gap:0.45rem;align-items:center;font-size:0.85rem;margin:0.2rem 0 0.6rem">
          <input type="checkbox" [(ngModel)]="fileUseAi" [disabled]="isPdf()" />
          Extraction assistée par IA <span class="muted">(image PNG/JPEG, si configurée)</span>
        </label>
        <button class="btn btn-primary" [disabled]="!file || busy" (click)="uploadFile()">
          {{ fileButtonLabel() }}
        </button>
      </div>

      <div class="card">
        <h3>Depuis un texte</h3>
        <textarea
          class="input"
          placeholder="Collez l'annonce ici…"
          [(ngModel)]="text"
        ></textarea>
        <label style="display:flex;gap:0.45rem;align-items:center;font-size:0.85rem;margin:0.2rem 0 0.6rem">
          <input type="checkbox" [(ngModel)]="useAi" />
          Extraction assistée par IA <span class="muted">(si configurée)</span>
        </label>
        <p class="muted" style="font-size:0.76rem;margin:0 0 0.6rem">
          Avec l'IA, un seul appel extrait les champs bruts ; le mapping vers vos référentiels reste
          déterministe. Sans IA, le moteur de règles interne s'applique.
        </p>
        <button class="btn btn-primary" [disabled]="!text.trim() || busy" (click)="submitText()">
          {{ textButtonLabel() }}
        </button>
      </div>

      <div class="card">
        <h3>Depuis un fichier structuré (CSV / JSON)</h3>
        <p class="muted" style="font-size:0.82rem;margin-top:0">
          Canal 100 % déterministe (sans OCR ni IA). Colonnes/clés :
          <code>title, starts_at, activity, event_type, venue, city, price, url…</code> ·
          requis : <code>title</code>, <code>starts_at</code>. Chaque ligne devient un événement à valider.
        </p>
        <div class="drop">
          <input type="file" accept=".csv,.json,text/csv,application/json" (change)="onStructuredFile($event)" />
          <p>Fichier CSV ou JSON — ou collez le contenu ci-dessous</p>
        </div>
        <textarea
          class="input"
          placeholder="key,title,starts_at&#10;t1,Tournoi Magic,2026-08-01T18:00:00Z"
          [(ngModel)]="structured"
        ></textarea>
        <button class="btn btn-primary" [disabled]="!structured.trim() || busy" (click)="submitStructured()">
          Importer le contenu structuré
        </button>
      </div>

      <div class="card">
        <h3>Depuis une URL</h3>
        <p class="muted" style="font-size:0.82rem;margin-top:0">
          Capture déterministe des événements balisés <code>schema.org</code> (JSON-LD) d'une page.
          Les pages sans balisage structuré ne produisent aucun événement.
        </p>
        <input
          class="input"
          type="url"
          placeholder="https://exemple.org/evenement"
          [(ngModel)]="url"
        />
        <button class="btn btn-primary" [disabled]="!url.trim() || busy" (click)="submitUrl()">
          Capturer la page
        </button>
      </div>

      @if (errorMsg) {
        <div class="card" style="border-left:4px solid var(--red, #c0392b)">
          <p style="color:var(--red, #c0392b);margin:0">{{ errorMsg }}</p>
        </div>
      }

      @if (result) {
        <div class="card result">
          @if (!resultSynchronous) {
            <p class="ok">{{ message }}</p>
            <p class="muted">
              Import #{{ result.id }} — statut {{ result.status }}. Le traitement est
              asynchrone ; retrouvez le candidat dans la validation une fois prêt.
            </p>
          } @else if (result.candidateCount > 0) {
            <p class="ok">{{ result.candidateCount }} candidat(s) prêt(s) à valider.</p>
            <p class="muted">Import #{{ result.id }} — retrouvez-les dans la page Validation.</p>
          } @else {
            <p style="color:var(--orange, #b45309);font-weight:600;margin:0">
              Aucun événement extrait de cette source.
            </p>
            <p class="muted">
              Import #{{ result.id }} — 0 candidat. La page ne contient probablement pas de données
              structurées <code>schema.org</code> lisibles sans exécuter son JavaScript (site rendu
              côté client), ou le contenu fourni était vide.
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class ImportComponent {
  file: File | null = null;
  fileUseAi = false;
  text = '';
  useAi = false;
  structured = '';
  url = '';
  busy = false;
  message = '';
  errorMsg = '';
  result: ImportResponse | null = null;
  /** Canal synchrone (structuré/URL/IA) : le nombre de candidats est définitif dès la réponse. */
  resultSynchronous = false;

  constructor(private readonly importsApi: ImportsApi) {}

  /** Affiche le message d'erreur renvoyé par l'API (ex. cause d'un échec d'extraction IA). */
  private onError(err: { error?: { message?: string } }): void {
    this.busy = false;
    this.errorMsg = err?.error?.message ?? "L'import a échoué.";
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  /** Charge le contenu texte d'un fichier CSV/JSON dans la zone (canal déterministe). */
  onStructuredFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    void file.text().then((content) => (this.structured = content));
  }

  submitStructured(): void {
    if (!this.structured.trim()) {
      return;
    }
    this.busy = true;
    this.importsApi.importStructured(this.structured).subscribe({
      next: (result) => this.onSuccess(result, '', true),
      error: (err) => this.onError(err),
    });
  }

  submitUrl(): void {
    if (!this.url.trim()) {
      return;
    }
    this.busy = true;
    this.importsApi.importUrl(this.url.trim()).subscribe({
      next: (result) => this.onSuccess(result, '', true),
      error: (err) => this.onError(err),
    });
  }

  /** Vrai si le fichier sélectionné est un PDF (l'extraction IA vision ne couvre que les images). */
  isPdf(): boolean {
    return this.file?.type === 'application/pdf';
  }

  textButtonLabel(): string {
    return this.useAi ? "Extraire avec l'IA" : 'Importer le texte';
  }

  fileButtonLabel(): string {
    return this.fileUseAi && !this.isPdf() ? "Extraire l'image avec l'IA" : 'Importer le fichier';
  }

  uploadFile(): void {
    if (!this.file) {
      return;
    }
    this.busy = true;
    const useAi = this.fileUseAi && !this.isPdf();
    const request = useAi ? this.importsApi.aiExtractFile(this.file) : this.importsApi.uploadFile(this.file);
    request.subscribe({
      next: (result) => this.onSuccess(result, 'Fichier envoyé, traitement lancé.', useAi),
      error: (err) => this.onError(err),
    });
  }

  submitText(): void {
    if (!this.text.trim()) {
      return;
    }
    this.busy = true;
    const request = this.useAi
      ? this.importsApi.importAiExtract(this.text)
      : this.importsApi.importText(this.text);
    request.subscribe({
      next: (result) => this.onSuccess(result, 'Texte envoyé, classification lancée.', this.useAi),
      error: (err) => this.onError(err),
    });
  }

  private onSuccess(result: ImportResponse, message: string, synchronous = false): void {
    this.result = result;
    this.message = message;
    this.resultSynchronous = synchronous;
    this.errorMsg = '';
    this.busy = false;
    this.text = '';
    this.structured = '';
    this.url = '';
    this.file = null;
    this.fileUseAi = false;
  }
}
