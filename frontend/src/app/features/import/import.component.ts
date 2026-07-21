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
        <button class="btn btn-primary" [disabled]="!file || busy" (click)="uploadFile()">
          Importer le fichier
        </button>
      </div>

      <div class="card">
        <h3>Depuis un texte</h3>
        <textarea
          class="input"
          placeholder="Collez l'annonce ici…"
          [(ngModel)]="text"
        ></textarea>
        <button class="btn btn-primary" [disabled]="!text.trim() || busy" (click)="submitText()">
          Importer le texte
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

      @if (result) {
        <div class="card result">
          <p class="ok">{{ message }}</p>
          <p class="muted">
            Import #{{ result.id }} — statut {{ result.status }}. Le traitement est
            asynchrone ; retrouvez le candidat dans la validation une fois prêt.
          </p>
        </div>
      }
    </div>
  `,
})
export class ImportComponent {
  file: File | null = null;
  text = '';
  structured = '';
  busy = false;
  message = '';
  result: ImportResponse | null = null;

  constructor(private readonly importsApi: ImportsApi) {}

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
      next: (result) => this.onSuccess(result, 'Contenu structuré importé, candidats prêts à valider.'),
      error: () => (this.busy = false),
    });
  }

  uploadFile(): void {
    if (!this.file) {
      return;
    }
    this.busy = true;
    this.importsApi.uploadFile(this.file).subscribe({
      next: (result) => this.onSuccess(result, 'Fichier envoyé, traitement lancé.'),
      error: () => (this.busy = false),
    });
  }

  submitText(): void {
    if (!this.text.trim()) {
      return;
    }
    this.busy = true;
    this.importsApi.importText(this.text).subscribe({
      next: (result) => this.onSuccess(result, 'Texte envoyé, classification lancée.'),
      error: () => (this.busy = false),
    });
  }

  private onSuccess(result: ImportResponse, message: string): void {
    this.result = result;
    this.message = message;
    this.busy = false;
    this.text = '';
    this.structured = '';
    this.file = null;
  }
}
