import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { AdminComponent } from './features/admin/admin.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CatalogueComponent } from './features/catalogue/catalogue.component';
import { CreateEventComponent } from './features/create-event/create-event.component';
import { EventDetailComponent } from './features/event-detail/event-detail.component';
import { ImportComponent } from './features/import/import.component';
import { LoginComponent } from './features/login/login.component';
import { ValidationComponent } from './features/validation/validation.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'discover', component: CatalogueComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'import', component: ImportComponent },
      { path: 'validation', component: ValidationComponent },
      { path: 'create', component: CreateEventComponent },
      { path: 'events/:id', component: EventDetailComponent },
      { path: 'dashboard', component: DashboardComponent, canActivate: [adminGuard] },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
      { path: '', redirectTo: 'discover', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
