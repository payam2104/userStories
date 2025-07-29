import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UndoSnackbarComponent } from './undo-snackbar.component';
import { signal } from '@angular/core';
import { UndoService } from '../../../core/services/undo/undo.service';

describe('UndoSnackbarComponent', () => {
  let component: UndoSnackbarComponent;
  let fixture: ComponentFixture<UndoSnackbarComponent>;

  // Mock-Signale
  const currentSignal = signal(() => null);
  const dismissSignal = signal(false);
  const testUndoSignal = signal<{ message: string; undo: () => void } | null>(null);


  const mockUndoService = {
    current: testUndoSignal, // signal<{ message: ..., undo: ... } | null>
    onDismissRequest: () => dismissSignal(), // richtig, ruft boolean-Wert ab
    requestHide: jasmine.createSpy(),
    dismiss: jasmine.createSpy()
  };

  beforeEach(() => {
    TestBed.overrideProvider(UndoService, { useValue: mockUndoService });

    TestBed.configureTestingModule({
      imports: [UndoSnackbarComponent]
    });

    fixture = TestBed.createComponent(UndoSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sollte `isHiding` auf true setzen, wenn dismiss aktiv ist und noch nicht versteckt', () => {
    testUndoSignal.set({ message: 'Test', undo: () => { } });
    dismissSignal.set(true);

    component['isHiding'].set(false);
    fixture.detectChanges(); // Triggert Angular's Change Detection → `effect()` wird neu evaluiert

    expect(component.isHiding()).toBeTrue();
  });

  it('sollte `isHiding` auf false setzen, wenn neue Undo-Aktion kommt während es versteckt ist', () => {
    // Zustand vorbereiten: es ist aktuell versteckt
    component['isHiding'].set(true);

    // Undo ist gesetzt, aber dismiss ist NICHT aktiv
    testUndoSignal.set({ message: 'Test', undo: () => { } });
    dismissSignal.set(false);

    fixture.detectChanges(); // Effekt wird neu bewertet

    // Erwartung: wieder sichtbar machen
    expect(component.isHiding()).toBeFalse();
  });

  it('sollte `requestHide` aufrufen, wenn `hide()` aufgerufen wird', () => {
    component.hide();

    expect(mockUndoService.requestHide).toHaveBeenCalled();
  });

  it('sollte `dismiss` und `isHiding` zurücksetzen, wenn `onAnimationEnd` aufgerufen wird und `isHiding` true ist', (done) => {
    component['isHiding'].set(true);
    component.onAnimationEnd();
    queueMicrotask(() => {
      expect(mockUndoService.dismiss).toHaveBeenCalled();
      done();
    });
  });



});
