import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { StoryMapComponent } from './story-map.component';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { DataIOService } from '../../../core/services/data-io/data-io.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Issue } from '../../../core/model/issue.model';

describe('StoryMapComponent', () => {
  let component: StoryMapComponent;
  let fixture: ComponentFixture<StoryMapComponent>;

  const releaseStoreMock = {
    releases: signal([]),
    initFromDB: jasmine.createSpy('initFromDB')
  };

  const mockIssues = signal([
    { id: 'i1', title: 'Issue 1', releaseId: 'r1' },
    { id: 'i2', title: 'Issue 2', releaseId: 'r2' },
    { id: 'i3', title: 'Issue 3', releaseId: 'r1' },
    { id: 'i4', title: 'Issue 4' } // kein Release
  ]);

  const issueStoreMock = {
    issues: mockIssues,
    unassignCompletelyWithUndo: jasmine.createSpy('unassignCompletelyWithUndo'),
    assignToStep: jasmine.createSpy('assignToStep')
  };


  beforeEach(async () => {
    const journeySignal = signal([
      {
        id: 'j1',
        name: 'Journey 1',
        steps: [{ id: 's1' }, { id: 's2' }]
      },
      {
        id: 'j2',
        name: 'Journey 2',
        steps: [{ id: 's3' }]
      }
    ]);

    const journeyStoreMock = {
      journeys: journeySignal,
      initFromDB: jasmine.createSpy('initFromDB')
    };

    await TestBed.configureTestingModule({
      imports: [StoryMapComponent],
      providers: [
        { provide: JourneyStore, useValue: journeyStoreMock },
        { provide: ReleaseStore, useValue: releaseStoreMock },
        { provide: IssueStore, useValue: issueStoreMock },
        { provide: DataIOService, useValue: {} }
      ]
    });

    fixture = TestBed.createComponent(StoryMapComponent);
    component = fixture.componentInstance;
    component.renderedColumnsCount = 0;
    component.dropListReady.set(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stellt Issues aus dem IssueStore bereit', () => {
    const issues = component.issues();
    expect(issues.length).toBe(4); // Erwartung: Es gibt 4 Issues
    expect(issues.map(i => i.id)).toEqual(['i1', 'i2', 'i3', 'i4']); // Erwartung: Die IDs stimmen
  });

  it('stellt Releases aus dem ReleaseStore bereit', () => {
    const releases = component.releases();
    expect(releases).toEqual([]); // Erwartung: Keine Releases vorhanden
  });

  it('liefert alle Step-IDs aus den Journeys', () => {
    const stepIds = component.allStepIds();
    expect(stepIds).toEqual(['s1', 's2', 's3']); // Erwartung: Alle Step-IDs korrekt extrahiert
  });

  it('liefert alle DropList-IDs inklusive "unassigned"', () => {
    const dropListIds = component.allDropListIds();
    expect(dropListIds).toEqual(['unassigned', 's1', 's2', 's3']); // Erwartung: Alle IDs enthalten
  });

  it('liefert alle Issues zu einer gegebenen Release-ID', () => {
    const result = component.getIssuesForRelease('r1');
    expect(result.length).toBe(2); // Erwartung: Zwei Issues gehören zu r1
    expect(result.map(i => i.id)).toEqual(['i1', 'i3']); // Erwartung: IDs stimmen überein
  });

  it('liefert ein leeres Array, wenn keine Issues zur Release-ID passen', () => {
    const result = component.getIssuesForRelease('nonexistent');
    expect(result).toEqual([]); // Erwartung: Keine Issues gefunden
  });

  it('ignoriert Issues ohne Release-ID', () => {
    const result = component.getIssuesForRelease(undefined as any);
    expect(result).toEqual([]); // Erwartung: Diese Issues werden übersprungen
  });

  it('setzt dropListReady auf true, wenn alle Spalten gerendert sind', () => {
    // Setup-Zurücksetzung!
    component.renderedColumnsCount = 0;
    component.dropListReady.set(false);

    component.onColumnRendered();
    expect(component.dropListReady()).toBeFalse(); // Erwartung: Nach erster Spalte noch false

    component.onColumnRendered();
    expect(component.dropListReady()).toBeTrue(); // Erwartung: Nach zweiter Spalte true
  });

  it('ruft unassignCompletelyWithUndo auf, wenn keine stepId übergeben wurde', () => {
    const mockIssue = { id: 'i1', title: 'Issue 1', description: 'description 1' };
    const dropEvent = { item: { data: mockIssue } } as CdkDragDrop<Issue[]>;

    issueStoreMock.unassignCompletelyWithUndo.calls.reset();
    component.drop(dropEvent, undefined);

    expect(issueStoreMock.unassignCompletelyWithUndo)
      .toHaveBeenCalledOnceWith('i1'); // Erwartung: Issue wurde entfernt
  });

  it('ruft assignToStep auf, wenn stepId vorhanden ist', () => {
    const mockIssue = { id: 'i1', title: 'Issue 1', description: 'description 1' };
    const dropEvent = { item: { data: mockIssue } } as CdkDragDrop<Issue[]>;

    issueStoreMock.assignToStep.calls.reset();
    component.drop(dropEvent, 's1');

    expect(issueStoreMock.assignToStep)
      .toHaveBeenCalledOnceWith('i1', 's1'); // Erwartung: Issue wurde zugewiesen
  });

  it('entfernt ein Issue vollständig bei Drop aus dem Bereich "unassigned"', () => {
    const mockIssue = { id: 'i2', title: 'Issue 2', releaseId: 'r2' };
    const dropEvent = { item: { data: mockIssue } } as CdkDragDrop<Issue[]>;

    issueStoreMock.unassignCompletelyWithUndo.calls.reset();
    component.dropFromUnassigned(dropEvent);

    expect(issueStoreMock.unassignCompletelyWithUndo)
      .toHaveBeenCalledOnceWith('i2'); // Erwartung: Unassigned-Issue wurde entfernt
  });

  it('weist ein Issue korrekt einem Step zu', () => {
    const mockIssue = { id: 'i3', title: 'Issue 3', releaseId: 'r1' };
    const dropEvent = { item: { data: mockIssue } } as CdkDragDrop<Issue[]>;

    issueStoreMock.assignToStep.calls.reset();
    component.dropFromStep(dropEvent, 's2');

    expect(issueStoreMock.assignToStep)
      .toHaveBeenCalledOnceWith('i3', 's2'); // Erwartung: Issue wurde korrekt verschoben
  });

  it('exportiert Journeys, Issues und Releases in eine JSON-Datei', () => {
    const exportSpy = jasmine.createSpy('exportToFile');
    (component as any).dataIO.exportToFile = exportSpy;

    component.exportJson();

    expect(exportSpy).toHaveBeenCalledOnceWith(
      {
        journeys: component.journeys(),
        issues: component.issues(),
        releases: component.releases()
      },
      'storymap-export.json'
    ); // Erwartung: Datenexport korrekt ausgelöst
  });

  it('importiert Daten aus Datei und setzt das Input-Feld zurück', async () => {
    const mockFile = new File(['{"foo":"bar"}'], 'test.json', { type: 'application/json' });

    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [mockFile] });

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });

    const importSpy = jasmine.createSpy('importFromFile').and.returnValue(Promise.resolve());
    (component as any).dataIO.importFromFile = importSpy;

    await component.importJson(event);

    expect(importSpy).toHaveBeenCalledOnceWith(mockFile); // Erwartung: Datei wurde importiert
    expect(input.value).toBe(''); // Erwartung: Input zurückgesetzt
  });

  it('macht nichts, wenn keine Datei ausgewählt wurde', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [] });

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });

    const importSpy = jasmine.createSpy('importFromFile');
    (component as any).dataIO.importFromFile = importSpy;

    await component.importJson(event);

    expect(importSpy).not.toHaveBeenCalled(); // Erwartung: Kein Import ohne Datei
  });

});
