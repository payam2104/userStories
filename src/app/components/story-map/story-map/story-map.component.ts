import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { JourneyColumnComponent } from '../journey-column/journey-column.component';
import { UnassignedIssuesComponent } from '../../issues/unassigned-issues/unassigned-issues.component';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DataIOService } from '../../../core/services/data-io/data-io.service';

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
  readonly dataIO = inject(DataIOService);

  // wird auf true gesetzt, sobald alle <app-journey-column> fertig gerendert sind
  renderedColumnsCount = 0;

  readonly journeyStore = inject(JourneyStore);
  readonly journeys = this.journeyStore.journeys;

  readonly issueStore = inject(IssueStore);
  readonly issues = computed(() => this.issueStore.issues());

  readonly releaseStore = inject(ReleaseStore);
  readonly releases = computed(() => this.releaseStore.releases());


  readonly allStepIds = computed(() =>
    this.journeys().flatMap(j => j.steps.map(s => s.id))
  );

  readonly allDropListIds = computed(() => {
    const validStepIds = this.journeys().flatMap(j => j.steps.map(s => s.id));
    return ['unassigned', ...validStepIds];
  });

  constructor() {
    this.journeyStore.initFromDB(); // journeys
    this.releaseStore.initFromDB(); // wichtig: damit Releases von Anfang an da sind
  }

  getIssuesForRelease = (releaseId: string): Issue[] => {
    if (!releaseId) return []; // oder if (releaseId == null)
    return this.issueStore.issues().filter(issue => issue.releaseId === releaseId);
  };


  onColumnRendered() {
    this.renderedColumnsCount++;
    if (this.renderedColumnsCount >= this.journeys().length) {
      // Jetzt erst connectedDropListIds verteilen
      this.dropListReady.set(true); // Jetzt sind alle DropLists im DOM
    }
  }

  drop(event: CdkDragDrop<Issue[]>, stepId?: string) {
    const issue = event.item.data as Issue;

    if (!stepId) {
      this.issueStore.unassignCompletelyWithUndo(issue.id);
      return;
    }

    this.issueStore.assignToStep(issue.id, stepId);
  }

  dropFromUnassigned(event: CdkDragDrop<Issue[]>) {
    const issue = event.item.data as Issue;
    // Komplett entfernen mit Undo (inkl. Release und Step)
    this.issueStore.unassignCompletelyWithUndo(issue.id);
  }

  dropFromStep(event: CdkDragDrop<Issue[]>, stepId: string) {
    const issue = event.item.data as Issue;
    this.issueStore.assignToStep(issue.id, stepId);
  }

  exportJson() {
    const data = {
      journeys: this.journeys(),
      issues: this.issues(),
      releases: this.releases()
    };

    this.dataIO.exportToFile(data, 'storymap-export.json');
  }


  async importJson(event: Event) {
    console.log('bin hier in importJson()');
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    await this.dataIO.importFromFile(file);

    input.value = ''; // Zurücksetzen, falls dieselbe Datei nochmal geladen wird
  }

}

