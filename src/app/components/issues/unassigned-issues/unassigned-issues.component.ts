import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { IssueStore } from '../../../core/stores/issue/issue.store';
import { Issue } from '../../../core/model/issue.model';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
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
  @Output() dropped = new EventEmitter<CdkDragDrop<Issue[]>>();

  private issueStore = inject(IssueStore);
  private journeyStore = inject(JourneyStore);
  private releaseStore = inject(ReleaseStore);

  readonly unassignedIssues = computed(() =>
    this.issueStore.issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  // Drop-Zonen berechnen (Steps + Releases)
  onDrop(event: CdkDragDrop<Issue[]>) {
    this.dropped.emit(event); // 🔁 Übergib das Event an die Parent-Komponente (story-map)
  }

  async resetData() {
    await this.issueStore.resetAll();
    await this.releaseStore.resetAll?.();
    await this.journeyStore.resetAll?.();
  }
}
