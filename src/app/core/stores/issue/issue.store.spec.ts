import { TestBed } from '@angular/core/testing';
import { IssueStore } from './issue.store';
import { JourneyStore } from '../journey/journey.store';
import { UndoService } from '../../services/undo/undo.service';
import { IssueDB } from '../../../core/services/issue-db/issue-db.service';

// Wir mocken issueDB als globale Singleton-Instanz
import * as IssueDBModule from '../../services/issue-db/issue-db.service';
import { signal } from '@angular/core';
import { Issue } from '../../model/issue.model';

function createMockIssue(partial: Partial<Issue> = {}): Issue {
  return {
    id: 'default-id',
    title: 'Default Title',
    description: '',
    stepId: '',
    releaseId: '',
    ...partial // überschreibt z. B. id oder stepId korrekt
  };
}

describe('IssueStore – initFromDB()', () => {
  let store: IssueStore;
  let undoServiceSpy: jasmine.SpyObj<UndoService>;
  let journeyStoreStub: Partial<JourneyStore>;
  let issueDB: IssueDB;

  beforeEach(() => {
    undoServiceSpy = jasmine.createSpyObj('UndoService', ['showUndo']);

    journeyStoreStub = {
      journeys: signal([])
    } as unknown as JourneyStore;

    TestBed.configureTestingModule({
      providers: [
        IssueStore,
        IssueDB,
        { provide: UndoService, useValue: undoServiceSpy },
        { provide: JourneyStore, useValue: journeyStoreStub }
      ]
    });

    store = TestBed.inject(IssueStore);
    issueDB = TestBed.inject(IssueDB);
    (store as any).undoService = undoServiceSpy;
  });

  it('sollte nur loadAllFromDB() aufrufen, wenn Issues vorhanden sind', async () => {
    const countSpy = spyOn(issueDB.issues, 'count').and.resolveTo(5);

    const seedSpy = spyOn<any>(store, 'seedMockData').and.callFake(() => Promise.resolve());
    const loadSpy = spyOn<any>(store, 'loadAllFromDB').and.callFake(() => Promise.resolve());

    await store.initFromDB();

    expect(seedSpy).not.toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('sollte seedMockData aufrufen, wenn DB leer ist', async () => {
    spyOn(issueDB.issues, 'count').and.resolveTo(0); // DB ist leer
    const seedSpy = spyOn(store as any, 'seedMockData').and.resolveTo();
    const loadSpy = spyOn(store as any, 'loadAllFromDB').and.resolveTo();

    await store.initFromDB();

    expect(seedSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });


  it('sollte seedInitialIssues() mit geladenen Mockdaten aufrufen', async () => {
    const mockIssues = [
      { id: 'i1', title: 'Issue 1', description: 'Testdesc 1', stepId: '', releaseId: '', createdAt: new Date().toISOString() },
      { id: 'i2', title: 'Issue 2', description: 'Testdesc 2', stepId: '', releaseId: '', createdAt: new Date().toISOString() }
    ];

    // 🧪 window.fetch mocken
    spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify(mockIssues))
    );

    // 🧪 Methode auf issueDB spyen
    const seedSpy = spyOn(issueDB, 'seedInitialIssues').and.resolveTo();

    // @ts-ignore Zugriff auf private Methode erlaubt
    await store['seedMockData']();

    expect(window.fetch).toHaveBeenCalledWith('assets/data/issues.seed.json');
    expect(seedSpy).toHaveBeenCalledOnceWith(mockIssues);
  });

  it('sollte getMockIssues() aus Datei laden und parsen', async () => {
    const mockIssues = [
      {
        id: 'i1',
        title: 'Issue 1',
        description: 'Desc 1',
        stepId: '',
        releaseId: '',
        createdAt: new Date().toISOString()
      }
    ];

    // fetch mocken mit JSON-Response
    spyOn(window, 'fetch').and.resolveTo(
      new Response(JSON.stringify(mockIssues))
    );

    // @ts-ignore: Zugriff auf private Methode
    const result = await store['getMockIssues']();

    expect(window.fetch).toHaveBeenCalledWith('assets/data/issues.seed.json');
    expect(result).toEqual(mockIssues);
  });

  it('sollte alle Issues laden, sortieren und im Signal setzen', async () => {
    const unsortedIssues = [
      { id: '2', order: 3, title: 'Issue 2', description: '', stepId: '', releaseId: '', createdAt: '' },
      { id: '1', order: 1, title: 'Issue 1', description: '', stepId: '', releaseId: '', createdAt: '' },
      { id: '3', title: 'Issue 3', description: '', stepId: '', releaseId: '', createdAt: '' } // ohne order
    ];

    const sortedIssues = [
      unsortedIssues[2], // order: undefined → wird zu 0 → zuerst
      unsortedIssues[1], // order: 1
      unsortedIssues[0], // order: 3
    ];

    spyOn(issueDB, 'getAll').and.resolveTo([...unsortedIssues]);

    // @ts-ignore: private Methode direkt aufrufen
    await store['loadAllFromDB']();

    expect(issueDB.getAll).toHaveBeenCalled();
    expect(store.issues()).toEqual(sortedIssues);
  });

  it('sollte Step zuweisen und Undo anbieten', async () => {
    const issue = createMockIssue({ id: '1', stepId: 'oldStep' });
    store['_issues'].set([issue]);

    const putSpy = spyOn(issueDB.issues, 'put').and.resolveTo();
    spyOn(store as any, 'getStepTitleById').and.returnValue('Neuer Step');

    await store.assignToStep('1', 'newStep');

    expect(issue.stepId).toBe('newStep');
    expect(putSpy).toHaveBeenCalledWith(issue);
    expect(undoServiceSpy.showUndo).toHaveBeenCalledWith(
      "Issue verschoben zu 'Neuer Step'",
      jasmine.any(Function)
    );

    // 🔄 Undo ausführen
    const undoFn = undoServiceSpy.showUndo.calls.mostRecent().args[1];
    await undoFn();
    expect(issue.stepId).toBe('oldStep');
  });

  it('sollte nichts tun, wenn Issue nicht gefunden wurde', async () => {
    // 👻 Leere Liste, d.h. das gesuchte Issue fehlt
    store['_issues'].set([]);

    const putSpy = spyOn(issueDB.issues, 'put').and.resolveTo();
    undoServiceSpy.showUndo.calls.reset();

    // 🧪 Methode aufrufen mit unbekannter ID
    await store.assignToStep('nichtVorhanden', 'irgendeinStep');

    // ✅ Erwartung: `put` und `undo` wurden NICHT aufgerufen
    expect(putSpy).not.toHaveBeenCalled();
    expect(undoServiceSpy.showUndo).not.toHaveBeenCalled();
  });

  it("sollte 'anderem Step' anzeigen, wenn stepTitle undefined ist", async () => {
    const issue = createMockIssue({ id: '1', stepId: 'oldStep' });
    store['_issues'].set([issue]);

    spyOn(issueDB.issues, 'put').and.resolveTo();
    spyOn(store as any, 'getStepTitleById').and.returnValue(undefined);

    await store.assignToStep('1', 'newStep');

    expect(undoServiceSpy.showUndo).toHaveBeenCalledWith(
      "Issue verschoben zu 'anderem Step'",
      jasmine.any(Function)
    );
  });

  it('sollte andere Issues unverändert lassen, wenn ID nicht passt', async () => {
    const issue1 = createMockIssue({ id: '1', releaseId: null });
    const issue2 = createMockIssue({ id: '2', releaseId: null }); // bleibt unverändert

    store['_issues'].set([issue1, issue2]);

    const updateSpy = spyOn(issueDB, 'updateIssuePartial').and.resolveTo();

    await store.assignToRelease('1', 'releaseA');

    const updatedList = store['_issues']();
    expect(updatedList.find(i => i.id === '2')).toBe(issue2); // unverändert

    expect(updateSpy).toHaveBeenCalledWith('1', { releaseId: 'releaseA' });
  });

  it('sollte den Namen eines Steps anhand der ID zurückgeben', () => {
    const mockJourneys = [
      {
        id: 'j1',
        name: 'Journey 1',
        steps: [
          { id: 's1', name: 'Start' },
          { id: 's2', name: 'Middle' }
        ]
      },
      {
        id: 'j2',
        name: 'Journey 2',
        steps: [
          { id: 's3', name: 'End' }
        ]
      }
    ];

    // ⏹ JourneyStore mit Steps simulieren
    (journeyStoreStub.journeys as any).set(mockJourneys);

    // @ts-ignore Zugriff auf private Methode
    const name = store['getStepTitleById']('s2');

    expect(name).toBe('Middle');
  });

  it('sollte undefined zurückgeben, wenn Step nicht existiert', () => {
    (journeyStoreStub.journeys as any).set([]);

    // @ts-ignore: Zugriff auf private Methode
    const name = store['getStepTitleById']('not-found');

    expect(name).toBeUndefined();
  });

  it('sollte Release zuweisen und Signal aktualisieren', async () => {
    const initialIssue = createMockIssue({ id: 'r1', releaseId: null });
    store['_issues'].set([initialIssue]);

    const updateSpy = spyOn(issueDB, 'updateIssuePartial').and.resolveTo();

    await store.assignToRelease('r1', 'rel-123');

    expect(updateSpy).toHaveBeenCalledWith('r1', { releaseId: 'rel-123' });

    const updatedIssue = store.issues().find(i => i.id === 'r1');
    expect(updatedIssue?.releaseId).toBe('rel-123');
  });

  it('sollte nichts tun, wenn Issue nicht gefunden wurde', async () => {
    store['_issues'].set([]); // keine Issues vorhanden

    const updateSpy = spyOn(issueDB, 'updateIssuePartial').and.resolveTo();

    await store.assignToRelease('unknown-id', 'rel-123');

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('sollte releaseId lokal und in der DB aktualisieren', () => {
    const issue = createMockIssue({ id: 'rel-1', releaseId: 'oldRel' });
    store['_issues'].set([issue]);

    const updateSpy = spyOn(issueDB, 'updateIssuePartial');

    store.updateIssueRelease('rel-1', 'newRel');

    // DB-Update wurde aufgerufen
    expect(updateSpy).toHaveBeenCalledWith('rel-1', { releaseId: 'newRel' });

    // Signal wurde aktualisiert
    const updated = store.issues().find(i => i.id === 'rel-1');
    expect(updated?.releaseId).toBe('newRel');
  });

  it('sollte nichts tun, wenn das Issue nicht gefunden wurde', () => {
    store['_issues'].set([]); // leer

    const updateSpy = spyOn(issueDB, 'updateIssuePartial');

    store.updateIssueRelease('unknown-id', 'newRel');

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('sollte andere Issues unverändert lassen, wenn ID nicht passt', () => {
    const issue1 = createMockIssue({ id: '1', releaseId: 'r1' });
    const issue2 = createMockIssue({ id: '2', releaseId: 'r2' }); // bleibt gleich

    store['_issues'].set([issue1, issue2]);

    const updateSpy = spyOn(issueDB, 'updateIssuePartial').and.stub();

    store.updateIssueRelease('1', 'r1-updated');

    const list = store['_issues']();
    const unchanged = list.find(i => i.id === '2');

    expect(unchanged).toBe(issue2); // === zeigt, dass es dasselbe Objekt ist
    expect(updateSpy).toHaveBeenCalledWith('1', { releaseId: 'r1-updated' });
  });


  it('sollte releaseId lokal entfernen (nur UI)', () => {
    const issue = createMockIssue({ id: 'rel-1', releaseId: 'release-123' });
    store['_issues'].set([issue]);

    store.removeFromRelease('rel-1');

    const updated = store.issues().find(i => i.id === 'rel-1');
    expect(updated?.releaseId).toBeUndefined();
  });

  it('sollte nichts ändern, wenn Issue nicht gefunden wurde', () => {
    const original = createMockIssue({ id: 'rel-1', releaseId: 'release-123' });
    store['_issues'].set([original]);

    store.removeFromRelease('unknown-id');

    const result = store.issues().find(i => i.id === 'rel-1');
    expect(result).toEqual(original); // unverändert
  });

  it('sollte Step und Release entfernen und Undo ermöglichen', async () => {
    const issue = createMockIssue({
      id: 'issue-123',
      stepId: 'step-1',
      releaseId: 'release-1',
    });
    store['_issues'].set([issue]);

    const putSpy = spyOn(issueDB.issues, 'put').and.resolveTo(undefined);

    let undoFn: () => Promise<void>; // 🔄 undoFn speichern

    // 💡 UndoService mit Async-Funktion abfangen
    undoServiceSpy.showUndo.and.callFake((_msg: string, fn: () => Promise<void>) => {
      undoFn = fn;
    });

    await store.unassignCompletelyWithUndo('issue-123');

    const updated = store.issues().find(i => i.id === 'issue-123');
    expect(updated?.stepId).toBeNull();
    expect(updated?.releaseId).toBeNull();

    expect(putSpy).toHaveBeenCalledTimes(1);
    expect(undoServiceSpy.showUndo).toHaveBeenCalledWith(
      'Issue wurde unassigned.',
      jasmine.any(Function)
    );

    // 🧪 Undo ausführen
    await undoFn!();

    const reverted = store.issues().find(i => i.id === 'issue-123');
    expect(reverted?.stepId).toBe('step-1');
    expect(reverted?.releaseId).toBe('release-1');

    expect(putSpy).toHaveBeenCalledTimes(2); // einmal bei unassign, einmal bei undo
  });

  it('sollte abbrechen, wenn das Issue nicht gefunden wird (early return)', async () => {
    let undoSpy: jasmine.Spy;

    undoSpy = store['undoService'].showUndo as jasmine.Spy;
    undoSpy.calls.reset();

    const issueId = 'not-existing';
    store['_issues'].set([
      createMockIssue({ id: '1' }),
      createMockIssue({ id: '2' }),
    ]);

    const dbSpy = spyOn(issueDB.issues, 'put');

    await store.unassignCompletelyWithUndo(issueId);

    expect(dbSpy).not.toHaveBeenCalled();
    expect(undoSpy).not.toHaveBeenCalled();
  });



  it('sollte alle Issues im Store überschreiben', () => {
    const issues = [
      createMockIssue({ id: 'i1' }),
      createMockIssue({ id: 'i2' }),
    ];

    store.setIssues(issues);

    const result = store.issues();
    expect(result.length).toBe(2);
    expect(result.map(i => i.id)).toEqual(['i1', 'i2']);
  });

  it('sollte alle Issues zurücksetzen und neu seeden', async () => {
    const clearSpy = spyOn(issueDB.issues, 'clear').and.resolveTo(undefined);
    const seedSpy = spyOn(store as any, 'getMockIssues').and.returnValue(Promise.resolve([createMockIssue()]));
    const loadSpy = spyOn(store as any, 'loadAllFromDB').and.callThrough();

    await store.resetAll();

    expect(clearSpy).toHaveBeenCalled();
    expect(seedSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('sollte alle Issues in der DB ersetzen und Store aktualisieren', async () => {
    const mockIssues = [
      createMockIssue({ id: 'a' }),
      createMockIssue({ id: 'b' })
    ];

    const clearSpy = spyOn(issueDB.issues, 'clear').and.resolveTo(undefined);
    const bulkAddSpy = spyOn(issueDB.issues, 'bulkAdd').and.resolveTo(undefined);

    store.replaceAll(mockIssues);

    // warten auf async Operation
    await flushPromises();

    expect(clearSpy).toHaveBeenCalled();
    expect(bulkAddSpy).toHaveBeenCalledWith(mockIssues);

    const current = store.issues();
    expect(current).toEqual(mockIssues);
  });

});

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve));
}
