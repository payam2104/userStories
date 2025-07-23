/*import { inject, Injectable, computed, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Release } from '../model/release.model';
import { ReleaseDB } from '../services/release-db.service';
import { IssueStore } from './issue.store';

@Injectable({ providedIn: 'root' })
export class ReleaseStore {

  private readonly _releases = signal<Release[]>([]);
  readonly releases = this._releases.asReadonly();

  constructor(
    private releaseDB: ReleaseDB,
    private issueStore: IssueStore
  ) {
    this.loadFromDB();
  }

  async loadFromDB() {
    const all = await this.releaseDB.getAll();
    this._releases.set(all);
  }

  async createRelease(release: Release): Promise<void> {
    const completeRelease: Release = {
      ...release,
      id: release.id || uuidv4()
    };
    await this.releaseDB.add(completeRelease);
    await this.loadFromDB(); // 🧠 direkt neu laden statt manuell hinzufügen
  }


  async updateRelease(updated: Release): Promise<void> {
    await this.releaseDB.releases.put(updated); // richtig: direkt auf releases-Table

    this._releases.update(list => {
      return list.map(r => (r.id === updated.id ? updated : r));
    });
  }


  async deleteRelease(id: string) {
    await this.releaseDB.deleteRelease(id);
    this._releases.update(list => list.filter(r => r.id !== id));
  }

  getReleaseById = (id: string) => computed(() =>
    this._releases().find(r => r.id === id)
  );

  async initFromDB() {
    await this.loadFromDB();
  }


  // Daten zurücksetzen
  async resetAll() {
    await this.releaseDB.releases.clear();
    await this.initFromDB();
  }
}*/


import { inject, Injectable, computed, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Release } from '../model/release.model';
import { ReleaseDB } from '../services/release-db.service';
import { IssueStore } from './issue.store';
import { UndoService } from '../services/undo.service';
import { Issue } from '../model/issue.model';

@Injectable({ providedIn: 'root' })
export class ReleaseStore {

  private readonly _releases = signal<Release[]>([]);
  readonly releases = this._releases.asReadonly();

  constructor(
    private releaseDB: ReleaseDB,
    private issueStore: IssueStore,
    private undoService: UndoService
  ) {
    this.loadFromDB();
  }

  async loadFromDB() {
    const all = await this.releaseDB.getAll();
    this._releases.set(all);
  }

  async createRelease(release: Release): Promise<void> {
    const completeRelease: Release = {
      ...release,
      id: release.id || uuidv4()
    };
    await this.releaseDB.add(completeRelease);
    await this.loadFromDB(); // 🧠 direkt neu laden statt manuell hinzufügen
  }

  async updateRelease(updated: Release): Promise<void> {
    await this.releaseDB.releases.put(updated);
    this._releases.update(list =>
      list.map(r => (r.id === updated.id ? updated : r))
    );
  }

  async deleteRelease(id: string) {
    await this.releaseDB.deleteRelease(id);
    this._releases.update(list => list.filter(r => r.id !== id));
  }

  async deleteReleaseWithUndo(release: Release) {
    const releaseId = release.id;

    // 🔁 Backup der Issues, die diesem Release zugeordnet sind
    const affectedIssues = this.issueStore.issues().filter(i => i.releaseId === releaseId);

    // 1. Release entfernen
    await this.deleteRelease(releaseId);

    // 2. Bei allen betroffenen Issues releaseId entfernen
    for (const issue of affectedIssues) {
      const updatedIssue: Issue = { ...issue, releaseId: undefined };
      await this.issueStore.removeFromRelease(issue.id);
      await this.issueStore['setIssues'](this.issueStore.issues().map(i =>
        i.id === updatedIssue.id ? updatedIssue : i
      ));
    }

    // 3. Snackbar mit Undo-Funktion
    this.undoService.showUndo(`Release '${release.name}' gelöscht`, async () => {
      // a) Release wiederherstellen
      await this.createRelease(release);

      // b) Alle Issues wieder dem Release zuordnen
      for (const issue of affectedIssues) {
        const restoredIssue: Issue = { ...issue, releaseId: releaseId };
        await this.issueStore.updateIssueRelease(issue.id, releaseId);
      }
    });
  }

  getReleaseById = (id: string) => computed(() =>
    this._releases().find(r => r.id === id)
  );

  async initFromDB() {
    await this.loadFromDB();
  }

  // Daten zurücksetzen
  async resetAll() {
    await this.releaseDB.releases.clear();
    await this.initFromDB();
  }
}
