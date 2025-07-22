import { Component, Input, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Issue } from '../../../core/model/issue.model';
import { Release } from '../../../core/model/release.model';
import { IssueStore } from '../../../core/stores/issue.store';
import { IssueCardComponent } from '../../story-map/issue-card/issue-card.component';

@Component({
  selector: 'app-release-drop-zone',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './release-drop-zone.component.html',
  styleUrls: ['./release-drop-zone.component.scss']
})
export class ReleaseDropZoneComponent {
  @Input({ required: true }) release!: Release;
  @Input() releases: Release[] = []; // HINZUGEFÜGT!

  private _issues: Issue[] = [];
  @Input({ required: true }) set issues(value: Issue[]) {
    this._issues = value;
    this.issuesSignal.set(value);
  }

  readonly issuesSignal = signal<Issue[]>([]);
  @Input() connectedDropListIds: string[] = [];

  private issueStore = inject(IssueStore);

  get dropListId(): string {
    return this.release?.id ? this.release.id : '';
  }

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;
    if (event.previousContainer !== event.container) {
      this.issueStore.assignToRelease(droppedIssue.id, this.release.id);
    }
  }

  getReleaseNameById = (releaseId: string | null | undefined): string => {
    return this.releases.find(r => r.id === releaseId)?.name ?? '';
  };
}

