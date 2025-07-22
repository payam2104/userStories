import { computed, Injectable, signal } from '@angular/core';
import { Issue } from '../model/issue.model';
import { issueDB } from '../services/issue-db.service';

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private readonly _issues = signal<Issue[]>([]);
  readonly issues = this._issues.asReadonly();

  constructor() {
    this.initFromDB(); // jetzt sicher
  }

  async initFromDB() {
    const count = await issueDB.issues.count();
    if (count === 0) {
      await this.seedMockData(); // Nur seeden, wenn DB leer
    }
    await this.loadAllFromDB(); // Immer laden
  }

  private async seedMockData() {
    await issueDB.seedInitialIssues(await this.getMockIssues());
  }

  private async getMockIssues(): Promise<Issue[]> {
    const response = await fetch('assets/data/issues.seed.json');
    return await response.json();
  }

  private async loadAllFromDB() {
    const issues = await issueDB.getAll();
    issues.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._issues.set(issues);

  }

  readonly unassignedIssues = computed(() =>
    this._issues()
      .filter(issue => !issue.stepId && !issue.releaseId)
  );

  assignToStep(issueId: string, stepId: string): void {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue || issue.stepId === stepId) return;

    const updated: Issue = { ...issue, stepId }; // releaseId bleibt erhalten

    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );

    issueDB.updateIssuePartial(issueId, {
      stepId
    });
  }


  async assignToRelease(issueId: string, releaseId: string | null) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId };

    await issueDB.updateIssuePartial(issueId, {
      releaseId
    });

    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );
  }

  updateIssueRelease(issueId: string, newReleaseId: string) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId: newReleaseId };

    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );

    issueDB.updateIssuePartial(issueId, { releaseId: newReleaseId });
  }

  removeFromRelease(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId
          ? { ...issue, releaseId: undefined }
          : issue
      )
    );
  }

  unassignFromStep(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId ? { ...issue, stepId: undefined } : issue
      )
    );
    issueDB.updateStep(issueId, undefined);
  }

  unassign(issueId: string): void {
    const updated = this._issues().map(issue =>
      issue.id === issueId ? { ...issue, stepId: null, releaseId: null } : issue
    );
    this._issues.set(updated);
    issueDB.updateIssuePartial(issueId, { stepId: null, releaseId: null });
  }


  setIssues(issues: Issue[]) {
    this._issues.set(issues);
  }

  async resetAll() {
    await issueDB.issues.clear();
    await this.seedMockData();
    await this.loadAllFromDB();
  }
}
