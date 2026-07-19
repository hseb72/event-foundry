import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { CreateEventInput, EventEditValue } from '../../core/models';
import { EventFormComponent } from '../../shared/event-form.component';

/**
 * Correction d'un Event éditable (brouillon / soumis) — FSPEC.13 « Modifié ». Permet de rattraper
 * une erreur de saisie (ex. dates incohérentes empêchant la publication) sans recréer l'événement.
 */
@Component({
  selector: 'app-edit-event',
  standalone: true,
  imports: [EventFormComponent, RouterLink],
  template: `
    <h1>Modifier l'événement</h1>

    @if (loadError) {
      <p style="color: var(--red, #c0392b)">{{ loadError }}</p>
      <a class="btn" routerLink="/organizer/events">Retour à mes événements</a>
    } @else if (initial && !initial.editable) {
      <div class="card" style="border-left: 4px solid var(--organizer); max-width: 640px">
        <p style="font-weight: 600">Cet événement n'est pas modifiable dans son état actuel ({{ initial.status }}).</p>
        <p class="muted">Dépubliez-le (ou restaurez-le) depuis « Mes événements » pour pouvoir le corriger.</p>
        <a class="btn" routerLink="/organizer/events">Retour à mes événements</a>
      </div>
    } @else if (initial) {
      <p class="muted">Corrigez les informations puis enregistrez. Le domaine reste déduit de l'activité.</p>
      @if (error) {
        <p style="color: var(--red, #c0392b)">{{ error }}</p>
      }
      <app-event-form
        submitLabel="Enregistrer les modifications"
        [initial]="initial"
        [busy]="busy"
        (save)="onSave($event)"
      />
    }
  `,
})
export class EditEventComponent implements OnInit {
  initial: EventEditValue | null = null;
  busy = false;
  error = '';
  loadError = '';
  private id = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventsApi: EventsApi,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.eventsApi.getForEdit(this.id).subscribe({
      next: (value) => (this.initial = value),
      error: (err) => (this.loadError = err?.error?.message ?? "Événement introuvable."),
    });
  }

  onSave(input: CreateEventInput): void {
    this.busy = true;
    this.error = '';
    this.eventsApi.update(this.id, input).subscribe({
      next: () => {
        this.busy = false;
        void this.router.navigate(['/organizer/events']);
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message ?? "La modification a échoué.";
      },
    });
  }
}
