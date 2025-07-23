import { Component, ElementRef, HostListener, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Issue } from '../../../core/model/issue.model';
import { Release } from '../../../core/model/release.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReleaseStore } from '../../../core/stores/release.store';
import { IssueStore } from '../../../core/stores/issue.store';
import { UndoService } from '../../../core/services/undo.service';

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

  constructor(
    private elementRef: ElementRef,
    private releaseStore: ReleaseStore,
    private issueStore: IssueStore,
    private undoService: UndoService
  ) { }

  get allReleases() {
    return this.releaseStore.releases();
  }

  /**
   * Gibt den Namen des zugeordneten Releases zurück.
   */
  get releaseName(): string | null {
    if (!this.issue?.releaseId) return null;
    return this.allReleases.find(r => r.id === this.issue.releaseId)?.name ?? null;
  }

  /**
   * Weist dem Issue ein neues Release zu und bietet eine Undo-Option an.
   */
  async assignReleaseToIssue(releaseId: string | null) {
    if (this.issue.releaseId === releaseId) {
      this.menuOpen = false;
      return;
    }

    const oldReleaseId = this.issue.releaseId ?? '';
    const newReleaseId = releaseId ?? '';
    const issueId = this.issue.id;

    this.issueStore.assignToRelease(issueId, newReleaseId);
    this.issue = { ...this.issue, releaseId: newReleaseId };
    this.menuOpen = false;

    const newTitle = this.allReleases.find(r => r.id === newReleaseId)?.name ?? 'anderem Release';

    this.undoService.showUndo(
      `Issue zu '${newTitle}' zugeordnet`,
      () => {
        this.issueStore.assignToRelease(issueId, oldReleaseId);
        this.issue = { ...this.issue, releaseId: oldReleaseId };
      }
    );
  }

  /**
   * Schließt das Menü, wenn außerhalb geklickt wurde.
   */
  @HostListener('document:click', ['$event.target'])
  onClickOutside(targetElement: HTMLElement) {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.menuOpen = false;
    }
  }
}
