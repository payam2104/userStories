import { Component, Input, Signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { IssueStore } from '../../../core/stores/issue.store';
import { issueDB } from '../../../core/services/issue-db.service';
import { Issue } from '../../../core/model/issue.model';
import { JourneyStore } from '../../../core/stores/journey.store';
import { ReleaseStore } from '../../../core/stores/release.store'; // 🆕
import { IssueCardComponent } from '../../story-map/issue-card/issue-card.component';

@Component({
  selector: 'app-unassigned-issues',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './unassigned-issues.component.html',
  styleUrls: ['./unassigned-issues.component.scss']
})
export class UnassignedIssuesComponent {
  // Entferne @Input – wir bauen das hier selbst dynamisch auf
  readonly issues: Signal<Issue[]>;

  // 🔌 Store-Instanzen
  private readonly journeyStore = inject(JourneyStore);
  private readonly issueStore = inject(IssueStore);
  private readonly releaseStore = inject(ReleaseStore); // 🆕

  constructor() {
    this.issues = this.issueStore.unassignedIssues;
  }

  // ✅ Alle Drop-Zonen dynamisch berechnen
  readonly connectedDropListIds = computed(() => {
    const stepIds = this.journeyStore.getAllSteps().map(step => step.id);
    const releaseIds = this.releaseStore.releases().map(r => `release_${r.id}`);
    return ['unassigned', ...stepIds, ...releaseIds];
  });

  onDrop(event: CdkDragDrop<Issue[]>) {
    const droppedIssue = event.item.data as Issue;
    const targetStepId = event.container.id;
    this.issueStore.assignToStep(droppedIssue.id, targetStepId);
  }

  async resetData() {
    // 1. DB leeren
    await issueDB.clearAll();

    // 2. Neu seeden
    await this.issueStore.resetAll();
    await this.journeyStore.initFromDB();

    // 3. UI aktualisieren
    this.issueStore.setIssues([]);
  }
}
