import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Signal } from '@angular/core';

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
  @Input({ required: true }) step!: Signal<Step>;
  @Input({ required: true }) issues!: Signal<Issue[]>;
  @Input() connectedDropListIds: string[] = [];

  constructor(private issueStore: IssueStore) { }

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;

    if (event.previousContainer !== event.container) {
      this.issueStore.assignToStep(droppedIssue.id, this.step().id);
    }
  }
}
/*
import { Component, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { Step } from '../../../core/model/step.model';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue.store';
import { appConfig } from '../../../core/utils/app.config';
import { IssueCardComponent } from '../../issues/issue-card/issue-card.component';

@Component({
  selector: 'app-step-box',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './step-box.component.html',
  styleUrls: ['./step-box.component.scss']
})
export class StepBoxComponent {
  @Input({ required: true }) step!: Signal<Step>;

  constructor(private issueStore: IssueStore) { }

  readonly issues = this.issueStore.issuesForStep(this.step().id);
  readonly connectedDropListIds = appConfig.allDropListIds;
  readonly allStepIds = appConfig.allDropListIds; // Optional: falls später für Validierung nötig

  onDrop(event: CdkDragDrop<Issue[]>) {
    const issue = event.item.data as Issue;
    issueStore.moveToStep(issue.id, this.step().id);
  }
}
*/