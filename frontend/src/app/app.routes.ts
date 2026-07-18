import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CatalogueComponent } from './features/catalogue/catalogue.component';
import { ImportComponent } from './features/import/import.component';
import { LoginComponent } from './features/login/login.component';
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
      { path: '', redirectTo: 'discover', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
