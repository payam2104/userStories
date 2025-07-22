import { Component, Input, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { IssueStore } from '../../../core/stores/issue.store';
import { issueDB } from '../../../core/services/issue-db.service';
import { Issue } from '../../../core/model/issue.model';
import { JourneyStore } from '../../../core/stores/journey.store';
import { ReleaseStore } from '../../../core/stores/release.store';
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

  readonly unassignedIssues = computed(() =>
    this.issueStore.issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  constructor(
    private issueStore: IssueStore,
    private journeyStore: JourneyStore,
    private releaseStore: ReleaseStore) { }

  // Drop-Zonen berechnen (Steps + Releases)
  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;
    const targetId = event.container.id;

    if (targetId === 'unassigned') {
      // vollständig loslösen
      this.issueStore.unassign(droppedIssue.id);
    } else if (targetId.startsWith('release_')) {
      const releaseId = targetId.replace('release_', '');
      this.issueStore.assignToRelease(droppedIssue.id, releaseId);
    } else {
      this.issueStore.assignToStep(droppedIssue.id, targetId);
    }
  }

  async resetData() {
    await this.issueStore.resetAll();
    await this.releaseStore.resetAll?.();
    await this.journeyStore.resetAll?.();
  }
}
