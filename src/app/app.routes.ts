import { Routes } from '@angular/router';

import { StoryMapComponent } from './components/story-map/story-map/story-map.component';

export const routes: Routes = [
  {
    path: '',
    component: StoryMapComponent,
    title: 'User Story Map'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
