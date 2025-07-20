import { Component, Input, Signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepBoxComponent } from '../step-box/step-box.component';
import { Journey } from '../../../core/model/journey.model';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue.store';
import { Step } from '../../../core/model/step.model';
import { Release } from '../../../core/model/release.mode';
import { ReleaseDropZoneComponent } from '../../releases/release-drop-zone/release-drop-zone.component';

@Component({
  selector: 'app-journey-column',
  standalone: true,
  imports: [CommonModule, StepBoxComponent, ReleaseDropZoneComponent],
  templateUrl: './journey-column.component.html',
  styleUrls: ['./journey-column.component.scss']
})
export class JourneyColumnComponent {
  @Input({ required: true }) journey!: Journey;
  @Input() allStepIds: string[] = [];
  @Input() releases: Release[] = [];
  @Input() getIssuesForRelease!: (releaseId: string) => Issue[];

  readonly issueStore = inject(IssueStore);
  readonly debugIssues = this.issueStore.issues;

  get connectedDropListIds(): string[] {
    return this.journey.steps.map(step => step.id);
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
