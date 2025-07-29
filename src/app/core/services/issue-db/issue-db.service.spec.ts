import { IssueDB } from './issue-db.service';
import { Issue } from '../../model/issue.model';

describe('IssueDB – seedInitialIssues()', () => {
  let service: IssueDB;

  const mockIssues: Issue[] = [
    { id: '', title: 'Issue 1', description: 'Desc 1', stepId: 'step1' },
    { id: '', title: 'Issue 2', description: 'Desc 2', stepId: 'step2' }
  ];

  beforeEach(async () => {
    // Vorherige DB löschen, falls vorhanden
    const tmp = new IssueDB();
    await tmp.delete(); // DB 'IssueDatabase' wird gelöscht
    service = new IssueDB(); // Neu initialisieren
  });

  afterEach(async () => {
    await service.delete(); // zur Sicherheit aufräumen
  });

  it('sollte Daten seeden, wenn die Datenbank leer ist', async () => {
    const mockData: Issue[] = [
      { id: 'i1', title: 'Issue 1', description: 'Desc 1', stepId: 's1' },
      { id: 'i2', title: 'Issue 2', description: 'Desc 2', stepId: 's2' }
    ];

    await service.seedInitialIssues(mockData);
    const all = await service.getAll();

    expect(all.length).toBe(2);
    expect(all.map(i => i.title).sort()).toEqual(['Issue 1', 'Issue 2'].sort());
  });


  it('sollte keine Daten seeden, wenn bereits Daten vorhanden sind', async () => {
    await service.seedInitialIssues(mockIssues); // Initial seeden
    const newMockIssues: Issue[] = [
      { id: '', title: 'Neue Issue', description: 'Andere', stepId: 's3' }
    ];

    await service.seedInitialIssues(newMockIssues); // Sollte ignoriert werden
    const all = await service.getAll();

    expect(all.length).toBe(2); // Nicht 3
    expect(all.some(issue => issue.title === 'Neue Issue')).toBeFalse();
  });

  it('sollte alle Issues aus der Datenbank abrufen', async () => {
    const mockIssues: Issue[] = [
      { id: 'i1', title: 'Test 1', description: 'Beschreibung 1', stepId: 's1' },
      { id: 'i2', title: 'Test 2', description: 'Beschreibung 2', stepId: 's2' }
    ];

    await service.issues.bulkPut(mockIssues);

    const result = await service.getAll();

    expect(result.length).toBe(2);
    expect(result[0].title).toBe('Test 1');
    expect(result[1].id).toBe('i2');
  });

  it('sollte das StepId eines Issues aktualisieren', async () => {
    const issue: Issue = {
      id: 'i1',
      title: 'Altes Issue',
      description: 'Beschreibung',
      stepId: 's1'
    };

    // Vorher: Issue mit altem Step
    await service.issues.put(issue);

    // Aktion: Step-Zuordnung ändern
    await service.updateStep('i1', 's2');

    // Ergebnis abfragen
    const updated = await service.issues.get('i1');
    expect(updated?.stepId).toBe('s2');
  });

  it('sollte bestimmte Felder eines Issues aktualisieren', async () => {
    const originalIssue: Issue = {
      id: 'i1',
      title: 'Originaltitel',
      description: 'Alte Beschreibung',
      stepId: 's1'
    };

    await service.issues.put(originalIssue);

    const changes: Partial<Issue> = {
      title: 'Neuer Titel',
      description: 'Neue Beschreibung'
    };

    await service.updateIssuePartial('i1', changes);

    const updated = await service.issues.get('i1');
    expect(updated?.title).toBe('Neuer Titel');
    expect(updated?.description).toBe('Neue Beschreibung');
    expect(updated?.stepId).toBe('s1'); // Unverändert
  });

  it('sollte nichts tun, wenn das Issue nicht existiert', async () => {
    const spy = spyOn(service.issues, 'put'); // beobachten, ob put() aufgerufen wird

    await service.updateIssuePartial('nicht-existent', {
      title: 'Ignoriert'
    });

    expect(spy).not.toHaveBeenCalled();
  });

});
