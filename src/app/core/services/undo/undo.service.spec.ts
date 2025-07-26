import { TestBed } from '@angular/core/testing';

import { UndoService } from './undo.service';

describe('UndoService', () => {
  let service: UndoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UndoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sollte anfangs null als current haben', () => {
    expect(service.current()).toBeNull();
  });

  it('sollte onDismissRequest anfangs false sein', () => {
    expect(service.onDismissRequest()).toBeFalse();
  });


  it('sollte nach showUndo die Aktion enthalten', () => {
    const undoFn = jasmine.createSpy('undoFn');
    service.showUndo('Testbeschreibung', undoFn, 5000);

    const current = service.current();
    expect(current).not.toBeNull();
    expect(current?.description).toBe('Testbeschreibung');
    expect(current?.undoFn).toBe(undoFn);
    expect(typeof current?.timeoutId).toBe('number');
  });

  it('sollte requestHide() nach Ablauf des Timers aufrufen', () => {
    jasmine.clock().install(); // ⏰ Timer manipulieren
    const undoFn = jasmine.createSpy('undoFn');
    const requestHideSpy = spyOn(service, 'requestHide').and.callThrough();

    service.showUndo('Auto-Dismiss Test', undoFn, 5000);

    expect(requestHideSpy).not.toHaveBeenCalled();

    // ⏩ Zeit vorspulen
    jasmine.clock().tick(5000);

    expect(requestHideSpy).toHaveBeenCalled();

    jasmine.clock().uninstall(); // 🧹 Aufräumen
  });

  it('sollte default timeout von 10000ms verwenden, wenn keine duration angegeben ist', () => {
    jasmine.clock().install();
    const undoFn = jasmine.createSpy('undoFn');
    const requestHideSpy = spyOn(service, 'requestHide').and.callThrough();

    service.showUndo('Standarddauer-Test', undoFn); // ⬅️ keine Dauer übergeben

    jasmine.clock().tick(9999);
    expect(requestHideSpy).not.toHaveBeenCalled();

    jasmine.clock().tick(1); // → jetzt bei 10000 ms
    expect(requestHideSpy).toHaveBeenCalled();

    jasmine.clock().uninstall();
  });

  it('sollte undoFn ausführen, Timeout abbrechen und requestHide() aufrufen', () => {
    const undoFn = jasmine.createSpy('undoFn');
    const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
    const requestHideSpy = spyOn(service, 'requestHide').and.callThrough();

    // Simuliere vorher gesetzte Undo-Aktion
    service['\u005fcurrent'].set({
      description: 'Test Undo',
      undoFn,
      timeoutId: 12345,
    });

    service.undo();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(12345);
    expect(undoFn).toHaveBeenCalled();
    expect(requestHideSpy).toHaveBeenCalled();
  });

  it('sollte clear() aufrufen und onDismissRequest auf false setzen', () => {
    const clearSpy = spyOn<any>(service, 'clear').and.callThrough();

    // Setze vorher testweise true
    service['\u005fonDismissRequest'].set(true);

    service.dismiss();

    expect(clearSpy).toHaveBeenCalled();
    expect(service.onDismissRequest()).toBeFalse();
  });

  it('sollte onDismissRequest auf true setzen', () => {
    // Vorher sicherstellen, dass es false ist
    service['\u005fonDismissRequest'].set(false);
    expect(service.onDismissRequest()).toBeFalse();

    service.requestHide();

    expect(service.onDismissRequest()).toBeTrue();
  });

  it('sollte die aktuelle Undo-Aktion entfernen und Timeout löschen', () => {
    const undoFn = jasmine.createSpy('undoFn');
    service.showUndo('Testaktion', undoFn, 5000);

    const currentBefore = service.current();
    expect(currentBefore).not.toBeNull();

    // Spy auf clearTimeout setzen
    spyOn(window, 'clearTimeout').and.callThrough();

    service.dismiss(); // → ruft intern `clear()`

    const currentAfter = service.current();
    expect(currentAfter).toBeNull();
    expect(clearTimeout).toHaveBeenCalledWith(currentBefore?.timeoutId);
  });

});
