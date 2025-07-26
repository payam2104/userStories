import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ReleaseStore } from '../../../core/stores/release/release.store';
import { IssueStore } from '../../../core/stores/issue/issue.store';

import { Release } from '../../../core/model/release.model';
import { UndoService } from '../../../core/services/undo/undo.service';

@Component({
  selector: 'app-release-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './release-detail.component.html',
  styleUrls: ['./release-detail.component.scss'],
})
export class ReleaseDetailComponent {
  // Services
  private releaseStore = inject(ReleaseStore);
  private issueStore = inject(IssueStore);
  private undoService = inject(UndoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Signals
  readonly releaseId = signal(this.route.snapshot.params['id'] ?? '');
  readonly allReleases = computed(() => this.releaseStore.releases());
  readonly release = computed(() => this.releaseStore.getReleaseById(this.releaseId())());
  readonly releaseIssues = computed(() =>
    this.issueStore.issues().filter(issue => issue.releaseId === this.releaseId())
  );

  // Formular
  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor() {
    const release = this.release();
    if (!this.releaseId() || !release) {
      this.navigateToReleaseListe();
      return;
    }

    // Setze Initialwerte im Formular
    this.form.patchValue({
      name: release.name,
      description: release.description,
    });
  }

  // Speichert das aktuelle Release und leitet danach zurück zur Übersicht
  async save(): Promise<void> {
    if (this.form.invalid) return;

    const { name, description } = this.form.getRawValue() as {
      name: string;
      description: string;
    };

    const updatedRelease: Release = {
      id: this.releaseId(),
      name,
      description,
    };

    await this.releaseStore.updateRelease(updatedRelease);
    this.navigateToReleaseListe();
  }

  // zurück zur Übersicht
  cancel(): void {
    this.navigateToReleaseListe();
  }

  // Verschiebt ein Issue in ein anderes Release
  // Ermöglicht Rückgängigmachen über Undo-Service
  moveIssueToRelease(issueId: string, newReleaseId: string): void {
    const issue = this.issueStore.issues().find(i => i.id === issueId);
    if (!issue || issue.releaseId === newReleaseId) return;

    const oldReleaseId = issue.releaseId ?? '';

    this.issueStore.updateIssueRelease(issueId, newReleaseId);

    const newTitle = this.getReleaseTitleById(newReleaseId);

    this.undoService.showUndo(
      `Issue zu '${newTitle ?? 'anderem Release'}' zugeordnet`,
      () => {
        this.issueStore.updateIssueRelease(issueId, oldReleaseId);
      }
    );
  }

  // Holt den Release-Titel zur angegebenen ID, falls vorhanden
  private getReleaseTitleById(id: string): string | undefined {
    return this.allReleases().find(r => r.id === id)?.name;
  }

  // Zurück zur Übersicht
  private navigateToReleaseListe(): void {
    this.router.navigate(['/releases']);
  }

}


