import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { JourneyColumnComponent } from '../journey-column/journey-column.component';
import { UnassignedIssuesComponent } from '../../issues/unassigned-issues/unassigned-issues.component';
import { JourneyStore } from '../../../core/stores/journey.store';


@Component({
  selector: 'app-story-map',
  standalone: true,
  imports: [CommonModule, JourneyColumnComponent, UnassignedIssuesComponent],
  templateUrl: './story-map.component.html',
  styleUrls: ['./story-map.component.scss']
})
export class StoryMapComponent {
  readonly store = inject(JourneyStore);
  readonly journeys = this.store.journeys;

  constructor() {
    this.store.initFromDB();
  }

  readonly allStepIds = computed(() =>
    this.journeys().flatMap(j => j.steps.map(s => s.id))
  );

}
