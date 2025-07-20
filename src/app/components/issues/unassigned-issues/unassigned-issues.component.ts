import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { IssueStore } from '../../../core/stores/issue.store';
import { issueDB } from '../../../core/services/issue-db.service';
import { Issue } from '../../../core/model/issue.model';
import { JourneyStore } from '../../../core/stores/journey.store';
import { IssueCardComponent } from '../../story-map/issue-card/issue-card.component';

@Component({
  selector: 'app-unassigned-issues',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './unassigned-issues.component.html',
  styleUrls: ['./unassigned-issues.component.scss']
})
export class UnassignedIssuesComponent {
  @Input() connectedDropListIds: string[] = [];
  
  readonly issues: Signal<Issue[]>;
  
  constructor(private journeyStore: JourneyStore, private issueStore: IssueStore) {
    this.issues = this.issueStore.unassignedIssues;
  }

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;
    const targetStepId = event.container.id;
    this.issueStore.assignToStep(droppedIssue.id, targetStepId);
  }

  async resetData() {
    // 1. Alle Issues aus IndexedDB löschen
    await issueDB.clearAll();

    // 2. Journeys neu aus journeys.seed.json seeden und in Signal setzen
    await this.journeyStore.initFromDB();

    // 3. Unassigned Issues im Store auf leere Liste setzen
    this.issueStore.setIssues([]);

    // Hinweis: unassignedIssues wird automatisch neu gerendert
  }



}
