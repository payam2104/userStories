import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../../core/model/issue.model';
import { Release } from '../../../core/model/release.model';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.scss']
})
export class IssueCardComponent {
  @Input({ required: true }) issue!: Issue;

  // 🆕 Übergabe aller Releases
  @Input({ required: false }) releases: Release[] = [];

  // 🧠 Release-Namen berechnen
  readonly releaseName = computed(() => {
    if (!this.issue.releaseId || !this.releases?.length) return null;
    return this.releases.find(r => r.id === this.issue.releaseId)?.name ?? null;
  });
}

