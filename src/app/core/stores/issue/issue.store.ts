import { inject, Injectable, signal } from '@angular/core';
import { Issue } from '../../model/issue.model';
import { IssueDB } from '../../services/issue-db/issue-db.service';
import { UndoService } from '../../services/undo/undo.service';
import { JourneyStore } from '../journey/journey.store';

// Globaler Store zur Verwaltung aller Issues, inklusive Zuordnung zu Steps und Releases.
// Nutzt signalbasiertes State-Management, Undo-Service und IndexedDB-Persistenz.
@Injectable({ providedIn: 'root' })
export class IssueStore {
  private undoService = inject(UndoService)
  private journeyStore = inject(JourneyStore)
  private issueDB = inject(IssueDB);
  
  // Signal für aktuelle Liste aller Issues
  private readonly _issues = signal<Issue[]>([]);
  readonly issues = this._issues.asReadonly();

  constructor() {
    // Daten aus DB laden (ggf. seeden)
    this.initFromDB();
  }

  /**
   * Initialisiert den Store mit Daten aus der Datenbank.
   * Führt ein Seeding durch, falls die DB leer ist.
   */
  async initFromDB() {
    const count = await this.issueDB.issues.count();
    if (count === 0) {
      await this.seedMockData(); // Nur seeden, wenn leer
    }
    await this.loadAllFromDB(); // Immer laden
  }

  /**
   * Führt das Seeding von Mock-Daten aus einer JSON-Datei durch.
   */
  private async seedMockData() {
    await this.issueDB.seedInitialIssues(await this.getMockIssues());
  }

  /**
   * Lädt Mock-Issues aus Datei 'assets/data/issues.seed.json'.
   */
  private async getMockIssues(): Promise<Issue[]> {
    const response = await fetch('assets/data/issues.seed.json');
    return await response.json();
  }

  /**
   * Lädt alle Issues aus der DB und sortiert sie nach `order`.
   */
  private async loadAllFromDB() {
    const issues = await this.issueDB.getAll();
    issues.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._issues.set(issues);
  }

  /**
   * Weist ein Issue einem Step zu und speichert den Zustand, inkl. Undo-Funktion.
   *
   * @param issueId - ID des Issues
   * @param newStepId - ID des Ziel-Steps
   */
  async assignToStep(issueId: string, newStepId: string) {
    const issues = this._issues(); // Aktuelle Liste holen
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return; // Falls nicht gefunden, abbrechen

    const oldStepId = issue.stepId; // Für Undo merken
    issue.stepId = newStepId;

    await this.issueDB.issues.put(issue); // Persistieren
    this._issues.set([...issues]); // Signal updaten (trigger rerender)

    const stepTitle = this.getStepTitleById(newStepId); // Für Snackbar

    this.undoService.showUndo(
      `Issue verschoben zu '${stepTitle ?? 'anderem Step'}'`,
      async () => {
        issue.stepId = oldStepId;
        await this.issueDB.issues.put(issue);
        this._issues.set([...this._issues()]); // Zustand zurücksetzen
      }
    );
  }

  /**
   * Liefert den Step-Titel anhand der ID (für Anzeigenamen in Snackbar etc.).
   *
   * @param stepId - ID des Steps
   */
  private getStepTitleById(stepId: string): string | undefined {
    const journeys = this.journeyStore.journeys();
    for (const journey of journeys) {
      const step = journey.steps.find(s => s.id === stepId);
      if (step) return step.name;
    }
    return undefined;
  }

  /**
   * Weist ein Issue einem Release zu und speichert es (auch `null` möglich).
   *
   * @param issueId - ID des Issues
   * @param releaseId - ID des Releases (oder `null` zum Entfernen)
   */
  async assignToRelease(issueId: string, releaseId: string | null) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId };
    await this.issueDB.updateIssuePartial(issueId, { releaseId });

    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );
  }

  /**
   * Aktualisiert die Release-Zuweisung eines Issues direkt (UI + DB).
   *
   * @param issueId - ID des Issues
   * @param newReleaseId - Neue Release-ID
   */
  updateIssueRelease(issueId: string, newReleaseId: string) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId: newReleaseId };
    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );

    this.issueDB.updateIssuePartial(issueId, { releaseId: newReleaseId });
  }

  /**
   * Entfernt die Release-Zuweisung eines Issues.
   *
   * @param issueId - ID des Issues
   */
  removeFromRelease(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId
          ? { ...issue, releaseId: undefined }
          : issue
      )
    );
  }

  /**
   * Entfernt Step und Release und bietet eine Undo-Option an.
   *
   * @param issueId - ID des Issues
   */
  async unassignCompletelyWithUndo(issueId: string) {
    const issues = this._issues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const { stepId, releaseId } = issue;

    issue.stepId = null;
    issue.releaseId = null;
    await this.issueDB.issues.put(issue);
    this._issues.set([...issues]);

    this.undoService.showUndo(
      `Issue wurde unassigned.`,
      async () => {
        issue.stepId = stepId;
        issue.releaseId = releaseId;
        await this.issueDB.issues.put(issue);
        this._issues.set([...this._issues()]);
      }
    );
  }

  /**
   * Überschreibt den internen State (Signal) mit einer neuen Liste.
   *
   * @param issues - Neue Liste von Issues
   */
  setIssues(issues: Issue[]) {
    this._issues.set(issues);
  }

  /**
   * Setzt die Datenbank zurück, lädt Seed-Daten und aktualisiert den Store.
   */
  async resetAll() {
    await this.issueDB.issues.clear();
    await this.seedMockData();
    await this.loadAllFromDB();
  }

  /**
   * Ersetzt alle Issues in der Datenbank durch eine neue Liste und aktualisiert den Store.
   *
   * @param issues - Neue Issues zur vollständigen Übernahme
   */
  async replaceAll(issues: Issue[]) {
    await this.issueDB.issues.clear();
    await this.issueDB.issues.bulkAdd(issues);
    this._issues.set(issues);
  }

}
