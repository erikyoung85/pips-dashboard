import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'participant/:name',
    loadComponent: () =>
      import('./participant-detail/participant-detail.component').then(
        (m) => m.ParticipantDetailComponent,
      ),
  },
];
