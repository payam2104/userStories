import { Component, ElementRef, HostListener, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../../core/model/issue.model';
import { Release } from '../../../core/model/release.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReleaseStore } from '../../../core/stores/release.store';
import { IssueStore } from '../../../core/stores/issue.store';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule, DragDropModule, OverlayModule],
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.scss']
})
export class IssueCardComponent {
  @Input({ required: true }) issue!: Issue;
  @Input({ required: false }) releases: Release[] = [];

  menuOpen = false;

  private readonly releaseStore = inject(ReleaseStore);
  private readonly issueStore = inject(IssueStore);
  readonly allReleases = this.releaseStore.releases;

  constructor(private elementRef: ElementRef) { }

  // Release-Namen berechnen
  get releaseName(): string | null {
    if (!this.issue?.releaseId) return null;
    return this.allReleases().find(r => r.id === this.issue.releaseId)?.name ?? null;
  }

  async assignReleaseToIssue(releaseId: string) {
    const updatedIssue = { ...this.issue, releaseId };
    await this.issueStore.assignToRelease(this.issue.id, releaseId);
    this.issue = updatedIssue;
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(targetElement: HTMLElement) {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.menuOpen = false;
    }
  }

}

