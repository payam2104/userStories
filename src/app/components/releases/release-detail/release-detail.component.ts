import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ReleaseStore } from '../../../core/stores/release.store';
import { IssueStore } from '../../../core/stores/issue.store';

import { Release } from '../../../core/model/release.model';
import { Issue } from '../../../core/model/issue.model';
import { UndoService } from '../../../core/services/undo.service';

@Component({
  selector: 'app-release-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './release-detail.component.html',
  styleUrls: ['./release-detail.component.scss'],
})
export class ReleaseDetailComponent implements OnInit {
  form!: FormGroup;

  releaseId = signal<string>('');
  releaseIssues = signal<Issue[]>([]);
  allReleases = signal<Release[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: ReleaseStore,
    private issueStore: IssueStore,
    private undoService: UndoService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe({
      next: (params: Params) => {
        const id = params['id'];
        if (!id) {
          this.router.navigate(['/releases']);
          return;
        }

        this.releaseId.set(id);
        this.allReleases.set(this.store.releases());

        const release = this.store.getReleaseById(id)();
        if (!release) {
          this.router.navigate(['/releases']);
          return;
        }

        this.form = this.fb.group({
          name: [release.name, Validators.required],
          description: [release.description],
        });

        this.refreshIssues();
      },
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    const updatedRelease: Release = {
      id: this.releaseId(),
      ...this.form.value,
    };

    await this.store.updateRelease(updatedRelease);
    this.router.navigate(['/releases']);
  }

  cancel(): void {
    this.router.navigate(['/releases']);
  }

  refreshIssues(): void {
    const currentId = this.releaseId();
    const all = this.issueStore.issues();
    const filtered = all.filter(issue => issue.releaseId === currentId);
    this.releaseIssues.set(filtered);
  }

  /*moveIssueToRelease(issueId: string, newReleaseId: string): void {
    const issue = this.issueStore.issues().find(i => i.id === issueId);
    if (!issue || issue.releaseId === newReleaseId) return;

    this.issueStore.updateIssueRelease(issueId, newReleaseId);
    this.refreshIssues();
  }*/

  moveIssueToRelease(issueId: string, newReleaseId: string): void {
  const issue = this.issueStore.issues().find(i => i.id === issueId);
  if (!issue || issue.releaseId === newReleaseId) return;

  const oldReleaseId = issue.releaseId ?? '';

  this.issueStore.updateIssueRelease(issueId, newReleaseId);
  this.refreshIssues();

  const newTitle = this.getReleaseTitleById(newReleaseId);

  this.undoService.showUndo(
    `Issue zu '${newTitle ?? 'anderem Release'}' zugeordnet`,
    () => {
      this.issueStore.updateIssueRelease(issueId, oldReleaseId);
      this.refreshIssues();
    }
  );
}


  private getReleaseTitleById(id: string): string | undefined {
    return this.allReleases().find(r => r.id === id)?.name;
  }


}
