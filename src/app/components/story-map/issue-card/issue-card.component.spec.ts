import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IssueCardComponent } from './issue-card.component';
import { ElementRef } from '@angular/core';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { UndoService } from '../../../core/services/undo/undo.service';
import { Release } from '../../../core/model/release.model';
import { Issue } from '../../../core/model/issue.model';

describe('IssueCardComponent', () => {
  let component: IssueCardComponent;
  let fixture: ComponentFixture<IssueCardComponent>;

  let mockIssueStore: jasmine.SpyObj<IssueStore>;
  let mockReleaseStore: jasmine.SpyObj<ReleaseStore>;
  let mockUndoService: jasmine.SpyObj<UndoService>;
  let mockElementRef: ElementRef;
  let insideElement: HTMLElement;
  let outsideElement: HTMLElement;

  const dummyIssue: Issue = { id: '1', title: 'Test Issue', releaseId: 'r1', stepId: '', description: '' };
  const dummyReleases: Release[] = [{ id: 'r1', name: 'Release 1' }, { id: 'r2', name: 'Release 2' }];

  beforeEach(() => {
    mockIssueStore = jasmine.createSpyObj('IssueStore', ['assignToRelease']);
    mockReleaseStore = jasmine.createSpyObj('ReleaseStore', [], { releases: jasmine.createSpy().and.returnValue(dummyReleases) });
    mockUndoService = jasmine.createSpyObj('UndoService', ['showUndo']);
    insideElement = document.createElement('div');
    outsideElement = document.createElement('div');

    mockElementRef = {
      nativeElement: {
        contains: (el: any) => el === insideElement
      }
    } as unknown as ElementRef;

    TestBed.overrideProvider(IssueStore, { useValue: mockIssueStore });
    TestBed.overrideProvider(ReleaseStore, { useValue: mockReleaseStore });
    TestBed.overrideProvider(UndoService, { useValue: mockUndoService });
    TestBed.overrideProvider(ElementRef, { useValue: mockElementRef });

    TestBed.configureTestingModule({
      imports: [IssueCardComponent]
    });

    fixture = TestBed.createComponent(IssueCardComponent);
    component = fixture.componentInstance;
    component.issue = { ...dummyIssue };
    component.releases = dummyReleases;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sollte alle Releases aus dem Store zurückgeben', () => {
    const result = component.allReleases;
    expect(result).toEqual(dummyReleases);
    expect(mockReleaseStore.releases).toHaveBeenCalled();
  });

  it('sollte den Namen des zugeordneten Releases zurückgeben', () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };
    fixture.detectChanges();

    const result = component.releaseName;
    expect(result).toBe('Release 1');
  });

  it('sollte null zurückgeben, wenn kein Release zugeordnet ist', () => {
    component.issue = { ...dummyIssue, releaseId: null };
    fixture.detectChanges();

    const result = component.releaseName;
    expect(result).toBeNull();
  });

  it('sollte null zurückgeben, wenn die Release-ID nicht im Store gefunden wird', () => {
    component.issue = { ...dummyIssue, releaseId: 'unbekannt' };
    fixture.detectChanges();

    const result = component.releaseName;
    expect(result).toBeNull();
  });

  it('sollte nichts tun und das Menü schließen, wenn das Release gleich bleibt', async () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };
    component.menuOpen = true;

    await component.assignReleaseToIssue('r1');

    expect(mockIssueStore.assignToRelease).not.toHaveBeenCalled();
    expect(mockUndoService.showUndo).not.toHaveBeenCalled();
    expect(component.menuOpen).toBeFalse();
  });

  it('sollte das Release ändern und Undo anzeigen, wenn sich das Release ändert', async () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };
    component.menuOpen = true;

    await component.assignReleaseToIssue('r2');

    // Prüfen, ob das neue Release gesetzt wurde
    expect(mockIssueStore.assignToRelease).toHaveBeenCalledWith('1', 'r2');
    expect(component.issue.releaseId).toBe('r2');

    // Undo-Service prüfen
    expect(mockUndoService.showUndo).toHaveBeenCalledWith(
      "Issue zu 'Release 2' zugeordnet",
      jasmine.any(Function)
    );

    // Menü sollte geschlossen sein
    expect(component.menuOpen).toBeFalse();
  });

  it('sollte bei Undo das alte Release wiederherstellen', async () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };

    await component.assignReleaseToIssue('r2');

    // Callback aus UndoService extrahieren und ausführen
    const undoCallback = mockUndoService.showUndo.calls.mostRecent().args[1];
    undoCallback();

    expect(mockIssueStore.assignToRelease).toHaveBeenCalledWith('1', 'r1');
    expect(component.issue.releaseId).toBe('r1');
  });

  it('sollte oldReleaseId als leeren String setzen, wenn releaseId undefined ist', async () => {
    component.issue = { ...dummyIssue, releaseId: undefined };

    await component.assignReleaseToIssue('r2');

    // Hier prüfen wir nur den internen Aufruf mit leerem alten Release
    expect(mockUndoService.showUndo).toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(Function)
    );

    // Undo Callback aufrufen und prüfen
    const undoCallback = mockUndoService.showUndo.calls.mostRecent().args[1];
    undoCallback();

    expect(mockIssueStore.assignToRelease).toHaveBeenCalledWith('1', '');
  });

  it('sollte newReleaseId als leeren String setzen, wenn releaseId null ist', async () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };

    await component.assignReleaseToIssue(null);

    expect(mockIssueStore.assignToRelease).toHaveBeenCalledWith('1', '');
  });

  it('sollte "anderem Release" als Fallback-Name setzen, wenn Release nicht gefunden wird', async () => {
    component.issue = { ...dummyIssue, releaseId: 'r1' };

    await component.assignReleaseToIssue('unbekannt');

    expect(mockUndoService.showUndo).toHaveBeenCalledWith(
      `Issue zu 'anderem Release' zugeordnet`,
      jasmine.any(Function)
    );
  });

  it('sollte Menü offen lassen, wenn innerhalb geklickt wird', () => {
    component.menuOpen = true;

    // Simuliere contains gibt true zurück
    spyOn(component['elementRef'].nativeElement, 'contains').and.returnValue(true);

    component.onClickOutside(insideElement);

    expect(component.menuOpen).toBeTrue();
  });

  it('sollte Menü schließen, wenn außerhalb geklickt wird', () => {
    component.menuOpen = true;

    // outsideElement ist nicht innerhalb des nativeElement laut Mock
    component.onClickOutside(outsideElement);

    expect(component.menuOpen).toBeFalse();
  });


});
