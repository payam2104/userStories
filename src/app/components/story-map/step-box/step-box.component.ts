import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Signal } from '@angular/core';

import { Issue } from '../../../core/model/issue.model';
import { Step } from '../../../core/model/step.model';
import { IssueStore } from '../../../core/stores/issue.store';

@Component({
  selector: 'app-step-box',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './step-box.component.html',
  styleUrls: ['./step-box.component.scss']
})
export class StepBoxComponent {
  @Input({ required: true }) step!: Signal<Step>;
  @Input({ required: true }) issues!: Signal<Issue[]>;
  @Input() connectedDropListIds: string[] = [];

  constructor(private issueStore: IssueStore) {}

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;

    if (event.previousContainer !== event.container) {
      this.issueStore.assignToStep(droppedIssue.id, this.step().id);
    }
  }
}
