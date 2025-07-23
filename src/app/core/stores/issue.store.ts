import { computed, Injectable, signal } from '@angular/core';
import { Issue } from '../model/issue.model';
import { issueDB } from '../services/issue-db.service';
import { UndoService } from '../services/undo.service';
import { JourneyStore } from './journey.store';

@Injectable({ providedIn: 'root' })
export class IssueStore {
  private readonly _issues = signal<Issue[]>([]);
  readonly issues = this._issues.asReadonly();

  constructor(
    private undoService: UndoService,
    private journeyStore: JourneyStore
  ) {
    this.initFromDB(); // Daten aus DB laden (ggf. seeden)
  }

  // Initialisiere Store aus DB (inkl. Seed-Daten, wenn leer)
  async initFromDB() {
    const count = await issueDB.issues.count();
    if (count === 0) {
      await this.seedMockData(); // Nur seeden, wenn leer
    }
    await this.loadAllFromDB(); // Immer laden
  }

  // Seed-Daten einfügen
  private async seedMockData() {
    await issueDB.seedInitialIssues(await this.getMockIssues());
  }

  // Lade Seed-Datei
  private async getMockIssues(): Promise<Issue[]> {
    const response = await fetch('assets/data/issues.seed.json');
    return await response.json();
  }

  // Lade alle Issues aus DB und sortiere nach Order
  private async loadAllFromDB() {
    const issues = await issueDB.getAll();
    issues.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._issues.set(issues);
  }

  // Nur Issues ohne Step und Release
  readonly unassignedIssues = computed(() =>
    this._issues().filter(issue => !issue.stepId && !issue.releaseId)
  );

  // Weise ein Issue einem Step zu, inkl. Undo
  async assignToStep(issueId: string, newStepId: string) {
    const issues = this._issues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const oldStepId = issue.stepId;
    issue.stepId = newStepId;
    await issueDB.issues.put(issue);
    this._issues.set([...issues]);

    const stepTitle = this.getStepTitleById(newStepId);
    this.undoService.showUndo(
      `Issue verschoben zu '${stepTitle ?? 'anderem Step'}'`,
      async () => {
        issue.stepId = oldStepId;
        await issueDB.issues.put(issue);
        this._issues.set([...this._issues()]);
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
    await issueDB.updateIssuePartial(issueId, { releaseId });

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

    issueDB.updateIssuePartial(issueId, { releaseId: newReleaseId });
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
    this._issues.update(list =>
      list.map(issue =>
        issue.id === issueId ? { ...issue, stepId: undefined } : issue
      )
    );
    issueDB.updateStep(issueId, undefined);
  }

  // Entferne Step & Release gleichzeitig (ohne Undo)
  unassign(issueId: string): void {
    const updated = this._issues().map(issue =>
      issue.id === issueId ? { ...issue, stepId: null, releaseId: null } : issue
    );
    this._issues.set(updated);
    issueDB.updateIssuePartial(issueId, { stepId: null, releaseId: null });
  }

  // 💡 Entferne Step & Release – aber mit Undo-Möglichkeit
  async unassignCompletelyWithUndo(issueId: string) {
    const issues = this._issues();
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const { stepId, releaseId } = issue;

    issue.stepId = null;
    issue.releaseId = null;
    await issueDB.issues.put(issue);
    this._issues.set([...issues]);

    this.undoService.showUndo(
      `Issue wurde unassigned.`,
      async () => {
        issue.stepId = stepId;
        issue.releaseId = releaseId;
        await issueDB.issues.put(issue);
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
    await issueDB.issues.clear();
    await this.seedMockData();
    await this.loadAllFromDB();
  }
}
