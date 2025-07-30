import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, Signal } from '@angular/core';

import { ReleaseListComponent } from './release-list.component';
import { Release } from '../../../core/model/release.model';
import { ReleaseStore } from '../../../core/stores/release/release.store';

describe('ReleaseListComponent', () => {
  let component: ReleaseListComponent;
  let fixture: ComponentFixture<ReleaseListComponent>;

  const dummyReleases: Release[] = [
    { id: 'r1', name: 'Alpha', description: 'Test A' },
    { id: 'r2', name: 'Beta', description: 'Test B' }
  ];

  const mockReleaseSignal: Signal<Release[]> = signal(dummyReleases);

  const mockReleaseStore = {
    releases: mockReleaseSignal,
    createRelease: jasmine.createSpy('createRelease'),
    deleteRelease: jasmine.createSpy(),
    deleteReleaseWithUndo: jasmine.createSpy('deleteReleaseWithUndo')
  };

  beforeEach(() => {
    TestBed.overrideProvider(ReleaseStore, { useValue: mockReleaseStore });

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ReleaseListComponent, RouterModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {},
            params: signal({}),
            queryParams: signal({})
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ReleaseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sollte `releases` korrekt setzen', () => {
    expect(component.releases()).toEqual(dummyReleases);
  });

  it('sollte das Formular korrekt initialisieren', () => {
    const form = component.form;

    expect(form).toBeTruthy();
    expect(form.controls['name']).toBeTruthy();
    expect(form.controls['description']).toBeTruthy();

    // Anfangswerte prüfen
    expect(form.value.name).toBe('');
    expect(form.value.description).toBe('');

    // Validatoren prüfen
    form.controls['name'].setValue('');
    expect(form.controls['name'].valid).toBeFalse();

    form.controls['name'].setValue('A'); // Zu kurz
    expect(form.controls['name'].valid).toBeFalse();

    form.controls['name'].setValue('Ab'); // Gültig
    expect(form.controls['name'].valid).toBeTrue();
  });

  it('sollte createRelease aufrufen und das Formular zurücksetzen, wenn das Formular gültig ist', async () => {
    // Arrange: gültige Werte setzen
    component.form.setValue({
      name: '  TestName  ', // mit Leerzeichen zum Testen von .trim()
      description: '  Beschreibung  '
    });

    // Act
    await component.create();

    // Assert
    expect(mockReleaseStore.createRelease).toHaveBeenCalledOnceWith({
      id: jasmine.any(String),
      name: 'TestName',
      description: 'Beschreibung'
    });

    expect(component.form.value.name).toBeNull(); // nach reset() ist das so
    expect(component.form.value.description).toBeNull();
  });

  it('sollte createRelease NICHT aufrufen, wenn das Formular ungültig ist', async () => {
    mockReleaseStore.createRelease.calls.reset(); // vorherige Aufrufe löschen

    component.form.setValue({
      name: 'A', // Ungültig: minLength = 2
      description: 'Beschreibung'
    });

    await component.create();

    expect(mockReleaseStore.createRelease).not.toHaveBeenCalled();
  });

  it('sollte deleteReleaseWithUndo mit dem übergebenen Release aufrufen', () => {
    const release: Release = { id: 'r3', name: 'Gamma', description: 'Test C' };
    component.deleteWithUndo(release);
    expect(mockReleaseStore.deleteReleaseWithUndo).toHaveBeenCalledWith(release);
  });


});
