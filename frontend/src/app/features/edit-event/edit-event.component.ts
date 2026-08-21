import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { ToastService } from '../../core/toast.service';
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
  templateUrl: './edit-event.component.html',
})
export class EditEventComponent implements OnInit {
  initial: EventEditValue | null = null;
  busy = false;
  error = '';
  loadError = '';
  private id = '';

  private readonly toast = inject(ToastService);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventsApi: EventsApi,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.eventsApi.getForEdit(this.id).subscribe({
      next: (value) => (this.initial = value),
      error: (err) => {
        this.loadError = err?.error?.message ?? 'Événement introuvable.';
        this.toast.fromHttp('Ouverture impossible', err, 'Événement introuvable.');
      },
    });
  }

  onSave(input: CreateEventInput): void {
    this.busy = true;
    this.error = '';
    this.eventsApi.update(this.id, input).subscribe({
      next: () => {
        this.busy = false;
        // La redirection quitte la page : le toast, monté à la racine, est le seul retour qui survit.
        this.toast.success('Modifications enregistrées');
        void this.router.navigate(['/organizer/events']);
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message ?? 'La modification a échoué.';
        this.toast.fromHttp('Enregistrement refusé', err);
      },
    });
  }
}
