import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { AdminComponent } from './features/admin/admin.component';
import { JobsAdminComponent } from './features/admin/jobs-admin.component';
import { ProvisionalCurationComponent } from './features/admin/provisional-curation.component';
import { UsersAdminComponent } from './features/admin/users-admin.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { SubmitEventComponent } from './features/submit/submit-event.component';
import { CatalogueComponent } from './features/catalogue/catalogue.component';
import { CreateEventComponent } from './features/create-event/create-event.component';
import { EditEventComponent } from './features/edit-event/edit-event.component';
import { EventDetailComponent } from './features/event-detail/event-detail.component';
import { FollowsComponent } from './features/follows/follows.component';
import { IdentityComponent } from './features/identity/identity.component';
import { ImportComponent } from './features/import/import.component';
import { OperatorAdminComponent } from './features/operator/operator-admin.component';
import { CasesConsoleComponent } from './features/operator/cases-console.component';
import { ModerationTermsComponent } from './features/operator/moderation-terms.component';
import { OperatorConfigComponent } from './features/operator/operator-config.component';
import { SupportComponent } from './features/support/support.component';
import { OrganizerDashboardComponent } from './features/organizer/organizer-dashboard.component';
import { OrganizerEventsComponent } from './features/organizer/organizer-events.component';
import { AcceptInvitationComponent } from './features/organizer/accept-invitation.component';
import { OrganizationsComponent } from './features/organizer/organizations.component';
import { LoginComponent } from './features/login/login.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { RecommendationsComponent } from './features/recommendations/recommendations.component';
import { SearchComponent } from './features/search/search.component';
import { ValidationComponent } from './features/validation/validation.component';
import { ConfirmEmailChangeComponent } from './features/account/confirm-email-change.component';
import { ForgotPasswordComponent } from './features/account/forgot-password.component';
import { ResetPasswordComponent } from './features/account/reset-password.component';
import { LandingComponent } from './features/landing/landing.component';
import { RegisterComponent } from './features/register/register.component';
import { VerifyEmailComponent } from './features/verify-email/verify-email.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  // Page de garde publique (vitrine) : point d'entrée d'un visiteur non authentifié.
  { path: 'welcome', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Publiques : cibles des liens de compte reçus par e-mail (FSPEC.18).
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'confirm-email-change', component: ConfirmEmailChangeComponent },
  // Cible du lien d'invitation (FSPEC.19) : gère l'auth puis fait rejoindre l'organisation.
  { path: 'accept-invitation', component: AcceptInvitationComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'me', component: IdentityComponent },
      { path: 'notifications', component: NotificationsComponent },
      {
        path: 'operator/admin',
        component: OperatorAdminComponent,
        canActivate: [permissionGuard('user.manage')],
      },
      {
        path: 'operator/config',
        component: OperatorConfigComponent,
        canActivate: [permissionGuard('pipeline.manage')],
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
      { path: 'organizer/organizations', component: OrganizationsComponent },
      { path: 'support', component: SupportComponent },
      {
        path: 'operator/cases',
        component: CasesConsoleComponent,
        canActivate: [permissionGuard('case.manage')],
      },
      {
        path: 'operator/moderation-terms',
        component: ModerationTermsComponent,
        canActivate: [permissionGuard('case.manage')],
      },
      { path: 'discover', component: CatalogueComponent },
      { path: 'search', component: SearchComponent },
      {
        path: 'recommendations',
        component: RecommendationsComponent,
        canActivate: [permissionGuard('recommendation.view')],
      },
      { path: 'calendar', component: CalendarComponent },
      // Menu Explorer unique : soumission + qualification + liste des événements privés (FSPEC.22).
      { path: 'my-events', component: SubmitEventComponent },
      { path: 'submit', redirectTo: 'my-events', pathMatch: 'full' },
      { path: 'follows', component: FollowsComponent },
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
          { path: 'reference/provisional', component: ProvisionalCurationComponent },
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
