import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Issue } from '../../model/issue.model';

@Injectable({
  providedIn: 'root'
})
export class IssueDB extends Dexie {
  // Tabelle für Issues, Primärschlüssel ist die ID (string)
  issues!: Table<Issue, string>;

  constructor() {
    super('IssueDatabase');

    // Datenbankschema: Index auf id, title, description und stepId
    this.version(1).stores({
      issues: 'id,title,description,stepId'
    });
  }

  /**
   * Initialisiert die Datenbank mit Dummy-Daten (nur wenn leer).
   * Fügt automatisch UUIDs hinzu, falls nicht vorhanden.
   */
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

  /**
   * Gibt alle gespeicherten Issues als Array zurück.
   */
  async getAll(): Promise<Issue[]> {
    return this.issues.toArray();
  }

  /**
   * Aktualisiert die Step-Zuordnung eines vorhandenen Issues.
   *
   * @param issueId - Die eindeutige ID des Issues, das aktualisiert werden soll.
   * @param stepId  - Die ID des Steps, dem das Issue neu zugeordnet wird (oder undefined, um die Zuordnung zu entfernen).
   */
  async updateStep(issueId: string, stepId: string | undefined): Promise<void> {
    const issue = await this.issues.get(issueId);
    if (issue) {
      issue.stepId = stepId;
      await this.issues.put(issue);
    }
  }

  /**
   * Aktualisiert ein bestehendes Issue partiell mit den angegebenen Änderungen.
   *
   * @param issueId - Die eindeutige ID des Issues, das aktualisiert werden soll.
   * @param changes - Ein Objekt mit den zu ändernden Feldern (z. B. title, description, stepId usw.).
   */
  async updateIssuePartial(issueId: string, changes: Partial<Issue>): Promise<void> {
    const issue = await this.issues.get(issueId);
    if (!issue) return;

    const updated = { ...issue, ...changes };
    await this.issues.put(updated);
  }

}

