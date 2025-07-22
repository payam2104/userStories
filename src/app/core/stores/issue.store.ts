import { computed, Injectable, signal } from '@angular/core';
import { Issue } from '../model/issue.model';
import { issueDB } from '../services/issue-db.service';

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private readonly _issues = signal<Issue[]>([]);
  readonly issues = this._issues.asReadonly();

  constructor() {
    this.initFromDB();
  }

  async initFromDB() {
    await issueDB.issues.clear(); // ⚠️ verhindert doppelte Einträge!
    await this.seedMockData();
    await this.loadAllFromDB();
  }

  // Seed-Methoden
  private async seedMockData() {
    await issueDB.seedInitialIssues(await this.getMockIssues());
  }

  private async loadAllFromDB() {
    const issues = await issueDB.getAll();
    this._issues.set(issues);
  }

  private async getMockIssues(): Promise<Issue[]> {
    const response = await fetch('assets/data/issues.seed.json');
    return await response.json();
  }

  // Computed
  readonly unassignedIssues = computed(() =>
    //this._issues().filter(issue => !issue.stepId)
    this._issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  // Step zuweisen (nur wenn nötig)
  assignToStep(issueId: string, stepId: string): void {
    this._issues.update(issues =>
      issues.map(issue =>
        issue.id === issueId && issue.stepId !== stepId
          ? { ...issue, stepId, releaseId: null }
          : issue
      )
    );
    issueDB.updateStep(issueId, stepId);
  }

  async assignToRelease(issueId: string, releaseId: string) {
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


  // aus Release entfernen
  removeFromRelease(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId
          ? { ...issue, releaseId: undefined }
          : issue
      )
    );
  }

  // Step entfernen
  unassignFromStep(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId ? { ...issue, stepId: undefined } : issue
      )
    );
    issueDB.updateStep(issueId, undefined);
  }

  // manuelles Setzen (z. B. bei Reset)
  setIssues(issues: Issue[]) {
    this._issues.set(issues);
  }

  // Daten zurücksetzen
  async resetAll() {
    await issueDB.issues.clear();
    await this.initFromDB();
  }
}
