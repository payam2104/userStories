import { Component, Input, computed, inject, signal, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { Issue } from '../../../core/model/issue.model';
import { Step } from '../../../core/model/step.model';
import { IssueStore } from '../../../core/stores/issue.store';
import { IssueCardComponent } from '../issue-card/issue-card.component';

@Component({
  selector: 'app-step-box',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './step-box.component.html',
  styleUrls: ['./step-box.component.scss']
})
export class StepBoxComponent {
  @Input() step?: Signal<Step>;
  @Input() issues: Signal<Issue[]> = signal([]);
  @Input() connectedDropListIds: string[] = [];
  @Output() dropped = new EventEmitter<CdkDragDrop<Issue[]>>();

  private issueStore = inject(IssueStore);

  /*onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;

    // Nur wenn step vorhanden ist
    if (event.previousContainer !== event.container && this.step) {
      const stepId = this.step().id;
      this.issueStore.assignToStep(droppedIssue.id, stepId);
    }
  }*/
}
