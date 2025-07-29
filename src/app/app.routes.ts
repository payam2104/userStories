import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/story-map/story-map/story-map.component')
        .then(m => m.StoryMapComponent)
  },
  {
    path: 'releases',
    loadComponent: () =>
      import('./components/releases/release-list/release-list.component')
        .then(m => m.ReleaseListComponent)
  },
  {
    path: 'releases/edit/:id',
    loadComponent: () =>
      import('./components/releases/release-detail/release-detail.component')
        .then(m => m.ReleaseDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
