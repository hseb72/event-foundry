import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { AdminComponent } from './features/admin/admin.component';
import { JobsAdminComponent } from './features/admin/jobs-admin.component';
import { UsersAdminComponent } from './features/admin/users-admin.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { CatalogueComponent } from './features/catalogue/catalogue.component';
import { CreateEventComponent } from './features/create-event/create-event.component';
import { EditEventComponent } from './features/edit-event/edit-event.component';
import { EventDetailComponent } from './features/event-detail/event-detail.component';
import { IdentityComponent } from './features/identity/identity.component';
import { ImportComponent } from './features/import/import.component';
import { OperatorAdminComponent } from './features/operator/operator-admin.component';
import { OrganizerDashboardComponent } from './features/organizer/organizer-dashboard.component';
import { OrganizerEventsComponent } from './features/organizer/organizer-events.component';
import { LoginComponent } from './features/login/login.component';
import { RecommendationsComponent } from './features/recommendations/recommendations.component';
import { SearchComponent } from './features/search/search.component';
import { ValidationComponent } from './features/validation/validation.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'me', component: IdentityComponent },
      {
        path: 'operator/admin',
        component: OperatorAdminComponent,
        canActivate: [permissionGuard('user.manage')],
      },
      {
        path: 'organizer/dashboard',
        component: OrganizerDashboardComponent,
        canActivate: [permissionGuard('event.create')],
      },
      {
        path: 'organizer/events',
        component: OrganizerEventsComponent,
        canActivate: [permissionGuard('event.create')],
      },
      { path: 'discover', component: CatalogueComponent },
      { path: 'search', component: SearchComponent },
      {
        path: 'recommendations',
        component: RecommendationsComponent,
        canActivate: [permissionGuard('recommendation.view')],
      },
      { path: 'calendar', component: CalendarComponent },
      { path: 'import', component: ImportComponent },
      { path: 'validation', component: ValidationComponent },
      { path: 'create', component: CreateEventComponent },
      {
        path: 'events/:id/edit',
        component: EditEventComponent,
        canActivate: [permissionGuard('event.update')],
      },
      { path: 'events/:id', component: EventDetailComponent },
      {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
          { path: 'dashboard', component: DashboardComponent },
          { path: 'reference', component: AdminComponent },
          { path: 'users', component: UsersAdminComponent },
          { path: 'jobs', component: JobsAdminComponent },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
