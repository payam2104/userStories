import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { IssueStore } from '../../../core/stores/issue/issue.store';
import { Issue } from '../../../core/model/issue.model';
import { IssueCardComponent } from '../../story-map/issue-card/issue-card.component';

@Component({
  selector: 'app-unassigned-issues',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './unassigned-issues.component.html',
  styleUrls: ['./unassigned-issues.component.scss']
})
export class UnassignedIssuesComponent {
  // Liste aller verbundenen Drop-Zonen
  @Input() connectedDropListIds: string[] = [];
  // Event-Emitter, um Drop-Events an die Elternkomponente weiterzugeben
  @Output() dropped = new EventEmitter<CdkDragDrop<Issue[]>>();

  private issueStore = inject(IssueStore);

  // Liefert alle nicht zugeordnete Issues
  readonly unassignedIssues = computed(() =>
    this.issueStore.issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  // Wird beim Drag & Drop ausgelöst und leitet das Event weiter an die Elternkomponente
  onDrop(event: CdkDragDrop<Issue[]>) {
    this.dropped.emit(event); // 🔁 Übergib das Event an die Parent-Komponente (story-map)
  }

}
