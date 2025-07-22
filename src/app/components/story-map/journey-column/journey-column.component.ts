import { Component, Input, Signal, inject, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepBoxComponent } from '../step-box/step-box.component';
import { Journey } from '../../../core/model/journey.model';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue.store';
import { Step } from '../../../core/model/step.model';

@Component({
  selector: 'app-journey-column',
  standalone: true,
  imports: [CommonModule, StepBoxComponent],
  templateUrl: './journey-column.component.html',
  styleUrls: ['./journey-column.component.scss']
})
export class JourneyColumnComponent {
  @Input({ required: true }) journey!: Journey;
  @Input() allStepIds: string[] = [];
  @Output() rendered = new EventEmitter<void>();
  @Input() connectedDropListIds: string[] = [];

  readonly issueStore = inject(IssueStore);

  ngAfterViewInit() {
    this.rendered.emit();
  }

  getIssuesForStep(stepId: string): Signal<Issue[]> {
    return computed(() =>
      this.issueStore.issues().filter(issue => issue.stepId === stepId)
    );
  }

  getStepSignal(step: Step): Signal<Step> {
    return computed(() => step);
  }
}
