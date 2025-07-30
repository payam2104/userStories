import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReleaseDetailComponent } from './release-detail.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { UndoService } from '../../../core/services/undo/undo.service';
import { Release } from '../../../core/model/release.model';
import { Issue } from '../../../core/model/issue.model';
import { signal } from '@angular/core';

describe('ReleaseDetailComponent - constructor()', () => {
  let fixture: ComponentFixture<ReleaseDetailComponent>;
  let component: ReleaseDetailComponent;

  let fakeReleaseStore: any;
  let fakeIssueStore: any;
  let routerSpy: any;
  let undoSpy: jasmine.Spy;

  // Beispiel-Release
  const beispielRelease: Release = {
    id: 'r1',
    name: 'Release 1',
    description: 'Beschreibung'
  };

  // Beispiel-Issues
  const beispielIssues: Issue[] = [
    { id: 'i1', title: 'Issue 1', description: '', releaseId: 'r1' },
    { id: 'i2', title: 'Issue 2', description: '', releaseId: 'r2' },
    { id: 'i3', title: 'Issue 3', description: '', releaseId: 'r1' }
  ];

  describe('wenn release vorhanden ist', () => {
    beforeEach(() => {
      routerSpy = jasmine.createSpyObj('Router', ['navigate']);
      undoSpy = jasmine.createSpy('showUndo');

      // Fake-Store für Releases mit Signals
      fakeReleaseStore = {
        releases: signal<Release[]>([beispielRelease]),
        getReleaseById: () => signal(beispielRelease),
        updateRelease: jasmine.createSpy('updateRelease').and.resolveTo()
      };

      // Fake-Store für Issues mit Signals
      fakeIssueStore = {
        issues: signal<Issue[]>(beispielIssues),
        updateIssueRelease: jasmine.createSpy('updateIssueRelease')
      };


      TestBed.configureTestingModule({
        imports: [ReleaseDetailComponent],
        providers: [
          // Route-Parameter mit ID r1 simulieren
          { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'r1' } } } },
          { provide: ReleaseStore, useValue: fakeReleaseStore },
          { provide: IssueStore, useValue: fakeIssueStore },
          { provide: FormBuilder, useValue: new FormBuilder() },
          { provide: Router, useValue: routerSpy },
          { provide: UndoService, useValue: { showUndo: undoSpy } }
        ]
      });

      fixture = TestBed.createComponent(ReleaseDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('sollte releaseId korrekt setzen, wenn ID vorhanden ist', () => {
      expect(component.releaseId()).toBe('r1');
    });

    it('sollte alle Releases korrekt über computed zurückgeben', () => {
      expect(component.allReleases()).toEqual([beispielRelease]);
    });

    it('sollte das richtige Release über computed zurückgeben', () => {
      expect(component.release()).toEqual(beispielRelease);
    });

    it('soll bei ungültigem Formular save() abbrechen', async () => {
      component.form.setValue({ name: '', description: '' });
      component.form.markAllAsTouched();
      component.form.updateValueAndValidity();

      const router = TestBed.inject(Router); // kein spyOn nötig

      await component.save();

      expect(fakeReleaseStore.updateRelease).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });


    it('soll name und description korrekt aus dem Formular extrahieren und übergeben', async () => {
      const name = 'Neuer Titel';
      const description = 'Neue Beschreibung';

      component.form.setValue({ name, description });

      fakeReleaseStore.updateRelease.calls.reset(); // statt spyOn(...)

      const router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
      router.navigate.calls.reset();

      await component.save();

      expect(fakeReleaseStore.updateRelease).toHaveBeenCalledWith(jasmine.objectContaining({
        name,
        description
      }));
    });

    it('soll navigateToReleaseListe aufrufen, wenn cancel() aufgerufen wird', () => {
      const spy = spyOn(component as any, 'navigateToReleaseListe');
      component.cancel();
      expect(spy).toHaveBeenCalled();
    });

    it('soll nichts tun, wenn Issue nicht existiert', () => {
      // Reset der Spy-Zähler
      fakeIssueStore.updateIssueRelease.calls.reset();
      undoSpy.calls.reset(); // HIER, nicht component['undoService'].showUndo!

      // Testausführung
      component.moveIssueToRelease('nichtVorhanden', 'r1');

      // Erwartung: keine Aufrufe erfolgt
      expect(fakeIssueStore.updateIssueRelease).not.toHaveBeenCalled();
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('soll nichts tun, wenn Issue nicht existiert', () => {
      fakeIssueStore.updateIssueRelease.calls.reset();
      undoSpy.calls.reset();

      component.moveIssueToRelease('nichtVorhanden', 'r1');

      expect(fakeIssueStore.updateIssueRelease).not.toHaveBeenCalled();
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('soll nichts tun, wenn Issue bereits im Ziel-Release ist', () => {
      fakeIssueStore.updateIssueRelease.calls.reset();
      undoSpy.calls.reset();

      // Issue i1 ist bereits in r1
      component.moveIssueToRelease('i1', 'r1');

      expect(fakeIssueStore.updateIssueRelease).not.toHaveBeenCalled();
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('soll Issue verschieben und Undo ermöglichen, wenn gültig', () => {
      fakeIssueStore.updateIssueRelease.calls.reset();
      undoSpy.calls.reset();

      component.moveIssueToRelease('i1', 'r2');

      // Sofortiger Update-Aufruf
      expect(fakeIssueStore.updateIssueRelease).toHaveBeenCalledWith('i1', 'r2');
      expect(undoSpy).toHaveBeenCalled();

      // Undo-Funktion prüfen
      const [msg, undoFn] = undoSpy.calls.mostRecent().args;

      expect(msg).toContain('Release'); // Message testbar, optional genau
      undoFn(); // Rückgängig machen

      expect(fakeIssueStore.updateIssueRelease).toHaveBeenCalledWith('i1', 'r1');
    });

    it('soll oldReleaseId als leeren String setzen, wenn issue.releaseId undefined ist', () => {
      const issueOhneRelease: Issue = { id: 'ix', title: 'Lost', description: '', releaseId: undefined as any };
      fakeIssueStore.issues = signal<Issue[]>([issueOhneRelease]);
      fakeIssueStore.updateIssueRelease.calls.reset();
      undoSpy.calls.reset();

      component.moveIssueToRelease('ix', 'r1');

      // Der neue Aufruf erfolgt
      expect(fakeIssueStore.updateIssueRelease).toHaveBeenCalledWith('ix', 'r1');

      // Undo aufrufen
      const [_msg, undoFn] = undoSpy.calls.mostRecent().args;
      undoFn(); // Rückgängig machen

      // Jetzt soll update zurück zu '' gehen
      expect(fakeIssueStore.updateIssueRelease).toHaveBeenCalledWith('ix', '');
    });

    it('soll den Titel des Releases zurückgeben, wenn ID gefunden wird', () => {
      const titel = component['getReleaseTitleById']('r1');
      expect(titel).toBe('Release 1');
    });

    it('soll undefined zurückgeben, wenn kein Release mit der ID existiert', () => {
      const titel = component['getReleaseTitleById']('unbekannt');
      expect(titel).toBeUndefined();
    });

    it('soll zu /releases navigieren', () => {
      const router = TestBed.inject(Router);
      const spy = router.navigate as jasmine.Spy;
      component['navigateToReleaseListe']();
      expect(spy).toHaveBeenCalledWith(['/releases']);
    });
  });

  describe('wenn release undefined ist', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ReleaseDetailComponent],
        providers: [
          { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'r999' } } } },
          { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
          {
            provide: ReleaseStore, useValue: {
              releases: signal<Release[]>([]),
              getReleaseById: () => signal<Release | undefined>(undefined),
            }
          },
          { provide: IssueStore, useValue: fakeIssueStore },
          { provide: UndoService, useValue: {} },
          { provide: FormBuilder, useValue: new FormBuilder() },
        ]
      });

      fixture = TestBed.createComponent(ReleaseDetailComponent);
      component = fixture.componentInstance;
    });

    it('soll navigateToReleaseListe aufrufen, wenn release undefined ist', () => {
      const router = TestBed.inject(Router);
      expect(router.navigate).toHaveBeenCalledWith(['/releases']);
    });
  });

  describe('wenn keine ID gesetzt ist', () => {
    beforeEach(() => {
      fakeReleaseStore = {
        releases: signal<Release[]>([beispielRelease]),
        getReleaseById: () => signal(beispielRelease),
        updateRelease: jasmine.createSpy('updateRelease').and.resolveTo()
      };

      fakeIssueStore = {
        issues: signal<Issue[]>(beispielIssues),
        updateIssueRelease: jasmine.createSpy('updateIssueRelease')
      };

      routerSpy = jasmine.createSpyObj('Router', ['navigate']);
      undoSpy = jasmine.createSpy('showUndo');

      TestBed.configureTestingModule({
        imports: [ReleaseDetailComponent],
        providers: [
          { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } }, // keine ID
          { provide: ReleaseStore, useValue: fakeReleaseStore },
          { provide: IssueStore, useValue: fakeIssueStore },
          { provide: FormBuilder, useValue: new FormBuilder() },
          { provide: Router, useValue: routerSpy },
          { provide: UndoService, useValue: { showUndo: undoSpy } }
        ]
      });

      fixture = TestBed.createComponent(ReleaseDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('sollte releaseId "" (leer) setzen, wenn keine ID vorhanden ist', () => {
      expect(component.releaseId()).toBe('');
    });
  });

});
