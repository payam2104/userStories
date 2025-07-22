import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { JourneyColumnComponent } from '../journey-column/journey-column.component';
import { UnassignedIssuesComponent } from '../../issues/unassigned-issues/unassigned-issues.component';
import { JourneyStore } from '../../../core/stores/journey.store';
import { ReleaseStore } from '../../../core/stores/release.store';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue.store';

@Component({
  selector: 'app-story-map',
  standalone: true,
  imports: [
    CommonModule,
    JourneyColumnComponent,
    UnassignedIssuesComponent],
  templateUrl: './story-map.component.html',
  styleUrls: ['./story-map.component.scss']
})
export class StoryMapComponent {
  readonly dropListReady = signal(false);

  // wird auf true gesetzt, sobald alle <app-journey-column> fertig gerendert sind
  renderedColumnsCount = 0;

  readonly store = inject(JourneyStore);
  readonly journeys = this.store.journeys;

  readonly issueStore = inject(IssueStore);
  readonly issues = computed(() => this.issueStore.issues());

  readonly releaseStore = inject(ReleaseStore);
  readonly releases = computed(() => this.releaseStore.releases());

  constructor() {
    this.store.initFromDB(); // journeys
    this.releaseStore.initFromDB(); // 🆕 wichtig: damit Releases von Anfang an da sind
  }

  readonly allStepIds = computed(() =>
    this.journeys().flatMap(j => j.steps.map(s => s.id))
  );

  getIssuesForRelease = (releaseId: string): Issue[] => {
    return this.issueStore.issues().filter(issue => issue.releaseId === releaseId);
  };

  readonly allDropListIds = computed(() => {
    const validStepIds = this.journeys().flatMap(j => j.steps.map(s => s.id));
    return ['unassigned', ...validStepIds];
  });



  onColumnRendered() {
    this.renderedColumnsCount++;
    if (this.renderedColumnsCount >= this.journeys().length) {
      // Jetzt erst connectedDropListIds verteilen
      this.dropListReady.set(true); // 🟢 Jetzt sind alle DropLists im DOM
    }
  }


}

