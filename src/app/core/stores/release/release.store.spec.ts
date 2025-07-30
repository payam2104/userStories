import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReleaseStore } from './release.store';
import { ReleaseDB } from '../../services/release-db/release-db.service';
import { IssueStore } from '../issue/issue.store';
import { UndoService } from '../../services/undo/undo.service';
import { Release } from '../../model/release.model';
import { Issue } from '../../model/issue.model';

describe('ReleaseStore - loadFromDB', () => {
  let store: ReleaseStore;
  let releaseDBMock: any;

  beforeEach(() => {
    const releaseDBSpy = jasmine.createSpyObj('ReleaseDB', ['getAll', 'add']);
    TestBed.configureTestingModule({
      providers: [
        ReleaseStore,
        { provide: ReleaseDB, useValue: releaseDBSpy },
        { provide: IssueStore, useValue: {} },
        { provide: UndoService, useValue: {} }
      ]
    });
    store = TestBed.inject(ReleaseStore);
    releaseDBMock = TestBed.inject(ReleaseDB) as any;//jasmine.SpyObj<ReleaseDB>;
  });

  it('lädt alle Releases aus der Datenbank und aktualisiert den Status', async () => {
    const mockReleases: Release[] = [
      { id: '1', name: 'Release 1' },
      { id: '2', name: 'Release 2' }
    ];

    releaseDBMock.getAll.and.resolveTo(mockReleases);

    await store.loadFromDB();

    expect(releaseDBMock.getAll).toHaveBeenCalledTimes(2);
    expect(store.releases()).toEqual(mockReleases);
  });

  it('erstellt ein neues Release mit automatisch generierter UUID und lädt anschließend alle Releases neu', async () => {
    spyOn(store, 'generateUUID').and.returnValue('1234');

    const releaseOhneId = { name: 'Neues Release' } as Partial<Release>;
    const gespeichertesRelease: Release = { id: '1234', name: 'Neues Release' };

    releaseDBMock.add.and.resolveTo();
    releaseDBMock.getAll.and.resolveTo([gespeichertesRelease]);

    await store.createRelease(releaseOhneId as Release);

    expect(releaseDBMock.add).toHaveBeenCalledWith({
      id: '1234',
      name: 'Neues Release'
    });

    expect(store.releases()).toEqual([gespeichertesRelease]);
  });


  it('gibt eine gültige UUID v4 zurück', () => {
    const result = store.generateUUID();

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);

    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(result).toMatch(uuidV4Regex);
  });

  it('ersetzt nur das Release mit passender ID, andere bleiben unverändert', fakeAsync(async () => {
    const r1: Release = { id: 'r1', name: 'Alt 1' };
    const r2: Release = { id: 'r2', name: 'Alt 2' };
    const r3: Release = { id: 'r3', name: 'Alt 3' };

    const updatedR2: Release = { id: 'r2', name: 'Neu 2' };

    const releasesSignal = signal<Release[]>([r1, r2, r3]);

    Object.defineProperty(store as any, '_releases', {
      value: releasesSignal,
      writable: true,
    });

    Object.defineProperty(store, 'releases', {
      value: releasesSignal.asReadonly(),
    });

    releaseDBMock.releases = jasmine.createSpyObj('Table', ['put']);
    releaseDBMock.releases.put.and.resolveTo();

    await store.updateRelease(updatedR2);
    tick();

    expect(store.releases()).toEqual([r1, updatedR2, r3]);
  }));

  it('löscht ein Release aus der Datenbank und dem Signal-Status', fakeAsync(async () => {
    // Arrange: initialer Zustand mit zwei Releases
    const r1: Release = { id: 'r1', name: 'Release 1' };
    const r2: Release = { id: 'r2', name: 'Release 2' };
    const releasesSignal = signal<Release[]>([r1, r2]);

    Object.defineProperty(store, '_releases', {
      value: releasesSignal,
      writable: true,
    });
    Object.defineProperty(store, 'releases', {
      value: releasesSignal.asReadonly(),
    });

    // Mock für deleteRelease()
    releaseDBMock.deleteRelease = jasmine.createSpy().and.resolveTo();

    // Act
    await store.deleteRelease('r1');
    tick();

    // Assert
    expect(releaseDBMock.deleteRelease).toHaveBeenCalledWith('r1');
    expect(store.releases()).toEqual([r2]); // Nur r2 sollte übrig bleiben
  }));

  it('löscht ein Release und bietet eine Undo-Option an', fakeAsync(async () => {
    // Arrange: Ein Release und zwei zugeordnete Issues
    const release: Release = { id: 'r1', name: 'Release 1' };
    const issue1: Issue = { id: 'i1', title: 'Issue 1', releaseId: 'r1', description: 'Beschreibung 1' };
    const issue2: Issue = { id: 'i2', title: 'Issue 2', releaseId: 'r1', description: 'Beschreibung 1' };

    const updatedIssue1: Issue = { ...issue1, releaseId: undefined };
    const updatedIssue2: Issue = { ...issue2, releaseId: undefined };

    // Manuelles Setzen des Signal-Status
    const releasesSignal = signal<Release[]>([release]);
    const issuesSignal = signal<Issue[]>([issue1, issue2]);

    Object.defineProperty(store, '_releases', {
      value: releasesSignal,
      writable: true,
    });
    Object.defineProperty(store, 'releases', {
      value: releasesSignal.asReadonly(),
    });

    const issueStoreMock = TestBed.inject(IssueStore) as any;
    issueStoreMock.issues = jasmine.createSpy().and.returnValue([issue1, issue2]);
    issueStoreMock.removeFromRelease = jasmine.createSpy().and.resolveTo();
    const updated = [updatedIssue1, updatedIssue2];
    issueStoreMock['setIssues'] = jasmine.createSpy().and.callFake(() => {
      issuesSignal.set(updated);
    });

    const undoServiceMock = TestBed.inject(UndoService) as any;
    undoServiceMock.showUndo = jasmine.createSpy();

    releaseDBMock.deleteRelease = jasmine.createSpy().and.resolveTo();

    // Act
    await store.deleteReleaseWithUndo(release);
    tick();

    // Assert
    expect(releaseDBMock.deleteRelease).toHaveBeenCalledWith('r1');
    expect(issueStoreMock.removeFromRelease).toHaveBeenCalledTimes(2);
    expect(issueStoreMock['setIssues']).toHaveBeenCalled();
    expect(undoServiceMock.showUndo).toHaveBeenCalled();

    // Prüfe Signal-Status (r1 gelöscht, Issues ohne releaseId)
    expect(store.releases()).toEqual([]);
    expect(issuesSignal()).toEqual([updatedIssue1, updatedIssue2]);
  }));

  it('stellt Release und zugehörige Issues bei Undo wieder her', fakeAsync(async () => {
    // Arrange
    const release: Release = { id: 'r1', name: 'Release X' };
    const issue1: Issue = {
      id: 'i1',
      title: 'Issue 1',
      description: 'Beschreibung 1',
      releaseId: 'r1'
    };

    const issue2: Issue = {
      id: 'i2',
      title: 'Issue 2',
      description: 'Beschreibung 2',
      releaseId: 'r1'
    };


    const issuesSignal = signal<Issue[]>([issue1, issue2]);

    // Signal-Setup
    Object.defineProperty(store, '_releases', {
      value: signal<Release[]>([]),
      writable: true,
    });

    const issueStoreMock = TestBed.inject(IssueStore) as any;
    issueStoreMock.issues = jasmine.createSpy().and.returnValue([issue1, issue2]);
    issueStoreMock.removeFromRelease = jasmine.createSpy().and.resolveTo();
    issueStoreMock['setIssues'] = jasmine.createSpy().and.callFake(() => {
      issuesSignal.set([
        { ...issue1, releaseId: undefined },
        { ...issue2, releaseId: undefined },
      ]);
    });

    issueStoreMock.updateIssueRelease = jasmine.createSpy().and.resolveTo();

    const createReleaseSpy = spyOn(store, 'createRelease').and.resolveTo();

    const undoServiceMock = TestBed.inject(UndoService) as any;

    // Hier fangen wir das Undo-Callback ab
    let undoFn: () => Promise<void> = async () => { };
    undoServiceMock.showUndo = jasmine.createSpy().and.callFake((_, fn) => {
      undoFn = fn;
    });

    releaseDBMock.deleteRelease = jasmine.createSpy().and.resolveTo();

    // Act: Soft-Löschen → Undo wird vorbereitet
    await store.deleteReleaseWithUndo(release);
    tick();

    // Undo auslösen
    await undoFn();
    tick();

    // Assert: Undo-Funktionen wurden korrekt aufgerufen
    expect(createReleaseSpy).toHaveBeenCalledWith(release);
    expect(issueStoreMock.updateIssueRelease).toHaveBeenCalledTimes(2);
    expect(issueStoreMock.updateIssueRelease).toHaveBeenCalledWith('i1', 'r1');
    expect(issueStoreMock.updateIssueRelease).toHaveBeenCalledWith('i2', 'r1');
  }));


  it('liefert das Release mit der gegebenen ID als computed Signal', () => {
    // Arrange
    const r1: Release = { id: 'r1', name: 'Alpha' };
    const r2: Release = { id: 'r2', name: 'Beta' };
    const releasesSignal = signal<Release[]>([r1, r2]);

    Object.defineProperty(store as any, '_releases', {
      value: releasesSignal,
      writable: true,
    });

    // Act
    const resultSignal = store.getReleaseById('r2');
    const result = resultSignal(); // computed-Signal aufrufen

    // Assert
    expect(result).toEqual(r2);
  });

  it('ruft loadFromDB() auf', fakeAsync(() => {
    const spy = spyOn(store as any, 'loadFromDB').and.resolveTo();

    store.initFromDB();
    tick();

    expect(spy).toHaveBeenCalled();
  }));

  it('löscht alle Releases aus der DB und lädt den Zustand neu', fakeAsync(async () => {
    // Arrange
    const release: Release = { id: 'r1', name: 'Release 1' };
    const releasesSignal = signal<Release[]>([release]);

    Object.defineProperty(store as any, '_releases', {
      value: releasesSignal,
      writable: true
    });

    releaseDBMock.releases = {
      clear: jasmine.createSpy().and.resolveTo()
    };
    spyOn(store as any, 'initFromDB').and.resolveTo();

    // Act
    await store.resetAll();
    tick();

    // Assert
    expect(releaseDBMock.releases.clear).toHaveBeenCalled();
    expect(store['initFromDB']).toHaveBeenCalled();
  }));

  it('setzt alle Releases in der DB neu und aktualisiert das Signal', fakeAsync(async () => {
    const releases: Release[] = [
      { id: 'r1', name: 'Release 1' },
      { id: 'r2', name: 'Release 2' }
    ];

    const releasesSignal = signal<Release[]>([]);
    Object.defineProperty(store as any, '_releases', {
      value: releasesSignal,
      writable: true,
    });

    Object.defineProperty(store, 'releases', {
      get: () => releasesSignal.asReadonly()
    });

    releaseDBMock.releases = {
      clear: jasmine.createSpy().and.resolveTo(),
      bulkAdd: jasmine.createSpy().and.resolveTo(),
    };

    // Act
    await store.replaceAll(releases);
    tick();

    // Assert
    expect(releaseDBMock.releases.clear).toHaveBeenCalled();
    expect(releaseDBMock.releases.bulkAdd).toHaveBeenCalledWith(releases);
    expect(store.releases()).toEqual(releases);
  }));

});
