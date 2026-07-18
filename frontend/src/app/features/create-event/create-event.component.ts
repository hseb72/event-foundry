import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { CreateEventInput } from '../../core/models';
import { EventFormComponent } from '../../shared/event-form.component';

/**
 * Création manuelle d'un Event (source=MANUAL, calculée côté Backend). Alimente la base
 * pour rendre « Découvrir » et « Mon planning » exploitables sans passer par l'import.
 */
@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [EventFormComponent],
  template: `
    <h1>Créer un événement</h1>
    <p class="muted">Saisie manuelle d'un événement. Le domaine est déduit de l'activité.</p>

    @if (success) {
      <div class="card" style="border-left: 4px solid var(--green); max-width: 640px">
        <p style="color: var(--green); font-weight: 600">Événement créé.</p>
        <p class="muted">Retrouvez-le dans « Découvrir ».</p>
      </div>
    }
    @if (error) {
      <p style="color: var(--red, #c0392b)">{{ error }}</p>
    }

    <app-event-form submitLabel="Créer l'événement" [busy]="busy" (save)="onSave($event)" />
  `,
})
export class CreateEventComponent {
  busy = false;
  success = false;
  error = '';

  constructor(
    private readonly eventsApi: EventsApi,
    private readonly router: Router,
  ) {}

  onSave(input: CreateEventInput): void {
    this.busy = true;
    this.success = false;
    this.error = '';
    this.eventsApi.create(input).subscribe({
      next: () => {
        this.busy = false;
        this.success = true;
        void this.router.navigate(['/discover']);
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message ?? "La création a échoué.";
      },
    });
  }
}
