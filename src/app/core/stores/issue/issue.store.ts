import { computed, inject, Injectable, signal } from '@angular/core';
import { Issue } from '../../model/issue.model';
import { IssueDB } from '../../services/issue-db/issue-db.service';
import { UndoService } from '../../services/undo/undo.service';
import { JourneyStore } from '../journey/journey.store';

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private undoService = inject(UndoService)
  private journeyStore = inject(JourneyStore)
  private readonly _issues = signal<Issue[]>([]);
  readonly issues = this._issues.asReadonly();
  private issueDB = inject(IssueDB);

  constructor() {
    this.initFromDB(); // Daten aus DB laden (ggf. seeden)
  }

  // Initialisiere Store aus DB (inkl. Seed-Daten, wenn leer)
  async initFromDB() {
    const count = await this.issueDB.issues.count();
    if (count === 0) {
      await this.seedMockData(); // Nur seeden, wenn leer
    }
    await this.loadAllFromDB(); // Immer laden
  }

  // Seed-Daten einfügen
  private async seedMockData() {
    await this.issueDB.seedInitialIssues(await this.getMockIssues());
  }

  // Lade Seed-Datei
  private async getMockIssues(): Promise<Issue[]> {
    const response = await fetch('assets/data/issues.seed.json');
    return await response.json();
  }

  // Lade alle Issues aus DB und sortiere nach Order
  private async loadAllFromDB() {
    const issues = await this.issueDB.getAll();
    issues.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._issues.set(issues);
  }

  // Nur Issues ohne Step und Release
  readonly unassignedIssues = computed(() =>
    this._issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  // Weise ein Issue einem Step zu, inkl. Undo
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

  // Titel eines Steps anhand ID finden (nur für Anzeige)
  private getStepTitleById(stepId: string): string | undefined {
    const journeys = this.journeyStore.journeys();
    for (const journey of journeys) {
      const step = journey.steps.find(s => s.id === stepId);
      if (step) return step.name;
    }
    return undefined;
  }

  // Weise ein Issue einem Release zu (direkt oder null)
  async assignToRelease(issueId: string, releaseId: string | null) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId };
    await this.issueDB.updateIssuePartial(issueId, { releaseId });

    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );
  }

  // Release-ID lokal und in DB aktualisieren
  updateIssueRelease(issueId: string, newReleaseId: string) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    const updated: Issue = { ...issue, releaseId: newReleaseId };
    this._issues.update(list =>
      list.map(i => i.id === issueId ? updated : i)
    );

    this.issueDB.updateIssuePartial(issueId, { releaseId: newReleaseId });
  }

  // Entferne Release-Zuweisung lokal (nur UI)
  removeFromRelease(issueId: string) {
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId
          ? { ...issue, releaseId: undefined }
          : issue
      )
    );
  }

  // Entferne Step-Zuweisung und speichere in DB
  unassignFromStep(issueId: string) {
    const issue = this._issues().find(i => i.id === issueId);
    if (!issue) return;

    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId ? { ...issue, stepId: undefined } : issue
      )
    );
    this.issueDB.updateStep(issueId, undefined);
  }

  // Entferne Step & Release gleichzeitig (ohne Undo)
  unassign(issueId: string): void {
    const exists = this._issues().some(i => i.id === issueId);
    if (!exists) return;

    const updated = this._issues().map(issue =>
      issue.id === issueId ? { ...issue, stepId: null, releaseId: null } : issue
    );
    this._issues.set(updated);
    this.issueDB.updateIssuePartial(issueId, { stepId: null, releaseId: null });
  }

  // 💡 Entferne Step & Release – aber mit Undo-Möglichkeit
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

  // Überschreibe alle Issues im Store
  setIssues(issues: Issue[]) {
    this._issues.set(issues);
  }

  // Alles zurücksetzen + neu seeden
  async resetAll() {
    await this.issueDB.issues.clear();
    await this.seedMockData();
    await this.loadAllFromDB();
  }

  // Ersetzt alle Issues in der Datenbank und aktualisiert den Signal-Status
  async replaceAll(issues: Issue[]) {
    await this.issueDB.issues.clear();
    await this.issueDB.issues.bulkAdd(issues);
    this._issues.set(issues);
  }

}
