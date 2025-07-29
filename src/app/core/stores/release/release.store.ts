import { inject, Injectable, computed, signal } from '@angular/core';
import * as uuid from 'uuid';
import { Release } from '../../model/release.model';
import { ReleaseDB } from '../../services/release-db/release-db.service';
import { IssueStore } from '../issue/issue.store';
import { UndoService } from '../../services/undo/undo.service';
import { Issue } from '../../model/issue.model';

// Globaler Store zur Verwaltung aller Releases.
// Nutzt Angular Signals für reaktiven State und speichert Releases via IndexedDB.
// Unterstützt Undo-Mechanismen bei Löschvorgängen.
@Injectable({ providedIn: 'root' })
export class ReleaseStore {
  // Interner Signal-State für Releases
  private readonly _releases = signal<Release[]>([]);
  // Öffentlicher Zugriff auf den readonly-State
  readonly releases = this._releases.asReadonly();

  // Dependencies via inject()
  private readonly releaseDB = inject(ReleaseDB);
  private readonly undoService = inject(UndoService);
  public readonly issueStore = inject(IssueStore);

  constructor() {
    // Lazy Init über queueMicrotask vermeidet Timing-Probleme bei inject()
    queueMicrotask(() => this.loadFromDB());
  }

  /**
   * Initialisiert den Store durch Laden aller Releases aus der IndexedDB.
   */
  async initFromDB() {
    await this.loadFromDB();
  }

  /**
   * Lädt alle Releases aus der Datenbank und aktualisiert den Signal-State.
   */
  async loadFromDB() {
    const all = await this.releaseDB.getAll();
    this._releases.set(all);
  }

  /**
   * Erstellt ein neues Release (mit UUID) und speichert es in der DB.
   * Danach wird die aktuelle Liste neu geladen.
   */
  async createRelease(release: Release): Promise<void> {
    const completeRelease: Release = {
      ...release,
      id: release.id || this.generateUUID()
    };
    await this.releaseDB.add(completeRelease);
    await this.loadFromDB(); // direkt neu laden statt manuell hinzufügen
  }

  /**
   * Generiert eine eindeutige UUID für Releases.
   */
  generateUUID(): string {
    return uuid.v4();
  }

  /**
   * Aktualisiert ein bestehendes Release in DB und Signal-State.
   *
   * @param updated - Das zu speichernde Release-Objekt
   */
  async updateRelease(updated: Release): Promise<void> {
    await this.releaseDB.releases.put(updated);
    this._releases.update(list =>
      list.map(r => (r.id === updated.id ? updated : r))
    );
  }

  /**
   * Entfernt ein Release (ohne Undo) aus DB und State.
   *
   * @param id - Die ID des zu löschenden Releases
   */
  async deleteRelease(id: string) {
    await this.releaseDB.deleteRelease(id);
    this._releases.update(list => list.filter(r => r.id !== id));
  }

  /**
   * Löscht ein Release inkl. Zuordnung aus allen Issues und bietet Undo-Möglichkeit.
   * Bei Undo werden sowohl das Release als auch die vorherigen Issue-Zuweisungen wiederhergestellt.
   *
   * @param release - Das zu löschende Release
   */
  async deleteReleaseWithUndo(release: Release) {
    const releaseId = release.id;

    // Betroffene Issues sichern
    const affectedIssues = this.issueStore.issues().filter(i => i.releaseId === releaseId);

    // 1. Release entfernen
    await this.deleteRelease(releaseId);

    // 2. Bei allen betroffenen Issues releaseId entfernen
    for (const issue of affectedIssues) {
      const updatedIssue: Issue = { ...issue, releaseId: undefined };
      await this.issueStore.removeFromRelease(issue.id);
      await this.issueStore.setIssues(this.issueStore.issues().map(i =>
        i.id === updatedIssue.id ? updatedIssue : i
      ));
    }

    // 3. Snackbar mit Undo-logik
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

  /**
   * Liefert ein bestimmtes Release als Computed Signal.
   *
   * @param id - Release-ID
   */
  getReleaseById = (id: string) => computed(() =>
    this._releases().find(r => r.id === id)
  );

  /**
   * Löscht alle Releases und lädt den Store neu.
   */
  async resetAll() {
    await this.releaseDB.releases.clear();
    await this.initFromDB();
  }

  /**
   * Ersetzt alle Releases durch eine neue Liste (DB + Signal-State).
   *
   * @param releases - Die neue Releases-Liste
   */
  async replaceAll(releases: Release[]) {
    await this.releaseDB.releases.clear();
    await this.releaseDB.releases.bulkAdd(releases);
    this._releases.set(releases);
  }

}
