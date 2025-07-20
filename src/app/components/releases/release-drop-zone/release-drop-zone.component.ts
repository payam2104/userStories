import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { IssueCardComponent } from '../../story-map/issue-card/issue-card.component';
import { Issue } from '../../../core/model/issue.model';
import { Release } from '../../../core/model/release.mode';
import { IssueStore } from '../../../core/stores/issue.store';

@Component({
  selector: 'app-release-drop-zone',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './release-drop-zone.component.html',
  styleUrls: ['./release-drop-zone.component.scss']
})
export class ReleaseDropZoneComponent {
  @Input({ required: true }) release!: Release;
  @Input({ required: true }) issues!: Issue[];
  @Input() connectedDropListIds: string[] = [];

  private issueStore = inject(IssueStore);

  get dropListId(): string {
    return `release-${this.release.id}`;
  }

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;
    if (event.previousContainer !== event.container) {
      this.issueStore.assignToRelease(droppedIssue.id, this.release.id);
    }
  }
}
