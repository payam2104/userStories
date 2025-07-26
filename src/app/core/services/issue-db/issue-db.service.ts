import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Issue } from '../../model/issue.model';

@Injectable({
  providedIn: 'root'
})
export class IssueDB extends Dexie {
  issues!: Table<Issue, string>;

  constructor() {
    super('IssueDatabase');

    this.version(1).stores({
      issues: 'id,title,description,stepId'
    });
  }

  // Seed aus JSON oder Dummy-Array
  async seedInitialIssues(data: Issue[]) {
    const count = await this.issues.count();
    if (count === 0) {
      const withUUIDs = data.map(issue => ({
        ...issue,
        id: uuidv4()
      }));
      await this.issues.bulkPut(withUUIDs);
    }
  }

  // Alle Issues abrufen
  async getAll(): Promise<Issue[]> {
    return this.issues.toArray();
  }

  // Schritt-Zuordnung ändern
  async updateStep(issueId: string, stepId: string | undefined): Promise<void> {
    const issue = await this.issues.get(issueId);
    if (issue) {
      issue.stepId = stepId;
      await this.issues.put(issue);
    }
  }

  async updateIssuePartial(issueId: string, changes: Partial<Issue>): Promise<void> {
    const issue = await this.issues.get(issueId);
    if (!issue) return;

    const updated = { ...issue, ...changes };
    await this.issues.put(updated);
  }

  async resetIssues(): Promise<void> {
    await this.issues.clear();
  }

  async clearAll(): Promise<void> {
    await this.issues.clear();
  }
}

//export const issueDB = new IssueDB();
