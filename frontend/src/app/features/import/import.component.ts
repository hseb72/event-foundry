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
        border-left: 4px solid var(--accent);
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
  busy = false;
  message = '';
  result: ImportResponse | null = null;

  constructor(private readonly importsApi: ImportsApi) {}

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files && input.files.length > 0 ? input.files[0] : null;
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
    this.file = null;
  }
}
