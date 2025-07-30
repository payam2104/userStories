import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { JourneyStore } from './journey.store';
import { JourneyDB } from '../../services/journey-db/journey-db.service';
import { Journey } from '../../model/journey.model';

describe('JourneyStore – initFromDB', () => {
  let store: JourneyStore;
  let journeyDBMock: any;

  beforeEach(() => {
    const journeyDBSpy = jasmine.createSpyObj('JourneyDB', [
      'seedInitialJourneys',
      'getAll',
      'addJourney',
      'addJourneys',
      'addStep',
      'clear'
    ]);

    TestBed.configureTestingModule({
      providers: [
        JourneyStore,
        { provide: JourneyDB, useValue: journeyDBSpy }
      ]
    });

    store = TestBed.inject(JourneyStore);
    journeyDBMock = TestBed.inject(JourneyDB) as any;
  });

  it('sollte seedInitialJourneys() und loadJourneys() korrekt ausführen', fakeAsync(async () => {
    const mockJourneys: Journey[] = [
      { id: 'j1', name: 'Journey A', order: 2, steps: [] },
      { id: 'j2', name: 'Journey B', order: 1, steps: [] }
    ];

    journeyDBMock.seedInitialJourneys.and.resolveTo();
    journeyDBMock.getAll.and.resolveTo(mockJourneys);

    // internen Signal-Status kontrollieren
    const journeysSignal = signal<Journey[]>([]);
    Object.defineProperty(store, '_journeys', {
      value: journeysSignal,
      writable: true
    });
    Object.defineProperty(store, 'journeys', {
      get: () => journeysSignal.asReadonly()
    });

    await store.initFromDB();
    tick();

    // Erwartung: seed und load wurden aufgerufen
    expect(journeyDBMock.seedInitialJourneys).toHaveBeenCalled();
    expect(journeyDBMock.getAll).toHaveBeenCalled();

    // Erwartung: Daten sind geladen und korrekt sortiert
    const sorted = [...mockJourneys].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    expect(store.journeys()).toEqual(sorted);
  }));

  it('behandelt Journeys ohne `order` als 0 beim Sortieren', fakeAsync(async () => {
    const mockJourneys: Journey[] = [
      { id: 'j2', name: 'Zweiter', order: 2, steps: [] },
      { id: 'j0', name: 'Kein Order', steps: [] }, // order = undefined
      { id: 'j1', name: 'Erster', order: 1, steps: [] }
    ];

    journeyDBMock.getAll.and.resolveTo(mockJourneys);

    const journeysSignal = signal<Journey[]>([]);
    Object.defineProperty(store, '_journeys', {
      value: journeysSignal,
      writable: true
    });
    Object.defineProperty(store, 'journeys', {
      get: () => journeysSignal.asReadonly()
    });

    await store.loadJourneys();
    tick();

    // Erwartung: Journey ohne `order` (j0) wird behandelt wie `order: 0` → steht also ganz vorne
    const expectedSorted = [
      { id: 'j0', name: 'Kein Order', steps: [] },
      { id: 'j1', name: 'Erster', order: 1, steps: [] },
      { id: 'j2', name: 'Zweiter', order: 2, steps: [] }
    ];

    expect(store.journeys()).toEqual(expectedSorted);
  }));


  it('lädt alle Journeys aus der Datenbank, sortiert sie nach `order` und aktualisiert den Signal-Status', fakeAsync(async () => {
    // Arrange – unsortierte Liste aus der DB
    const mockJourneys: Journey[] = [
      { id: 'j2', name: 'Zweiter', order: 2, steps: [] },
      { id: 'j1', name: 'Erster', order: 1, steps: [] },
      { id: 'j3', name: 'Ohne Order', steps: [] } // order = undefined
    ];

    // Spy konfigurieren
    journeyDBMock.getAll.and.resolveTo(mockJourneys);

    // internen Signal-Status manuell setzen
    const journeysSignal = signal<Journey[]>([]);
    Object.defineProperty(store, '_journeys', {
      value: journeysSignal,
      writable: true
    });
    Object.defineProperty(store, 'journeys', {
      get: () => journeysSignal.asReadonly()
    });

    // Act
    await store.loadJourneys();
    tick();

    // Assert – Prüfung auf Sortierung nach `order`
    const expectedSorted = [
      { id: 'j3', name: 'Ohne Order', steps: [] }, // order = undefined → treated as 0 → kommt zuerst
      { id: 'j1', name: 'Erster', order: 1, steps: [] },
      { id: 'j2', name: 'Zweiter', order: 2, steps: [] }
    ];


    expect(journeyDBMock.getAll).toHaveBeenCalled();
    expect(store.journeys()).toEqual(expectedSorted);
  }));

  it('sollte Journeys mit UUIDs aus assets/data/journeys.seed.json laden und in DB speichern', async () => {
    const mockResponse = [
      {
        name: 'Journey ohne ID',
        steps: [{ name: 'Step ohne ID', user_journey_id: 'tmp' }]
      },
      {
        id: 'j1',
        name: 'Journey mit ID',
        steps: [{ id: 's1', name: 'Step mit ID', user_journey_id: 'j1' }]
      }
    ] as any;

    // fetch() mocken
    spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify(mockResponse)));

    // @ts-ignore: Zugriff auf private Methode nur für den Test
    const promise = store['seedMockData']();

    await promise;

    expect(journeyDBMock.addJourneys).toHaveBeenCalled();

    const savedJourneys = journeyDBMock.addJourneys.calls.mostRecent().args[0] as Journey[];

    expect(savedJourneys.length).toBe(2);

    // UUID generiert?
    expect(savedJourneys[0].id).toMatch(/^[\w-]{36}$/);
    expect(savedJourneys[0].steps[0].id).toMatch(/^[\w-]{36}$/);

    // Bestehende IDs bleiben erhalten
    expect(savedJourneys[1].id).toBe('j1');
    expect(savedJourneys[1].steps[0].id).toBe('s1');
  });

  it('sollte alle Journeys löschen, neu seeden und dann neu laden', async () => {
    const clearSpy = journeyDBMock.clear.and.resolveTo();
    const seedSpy = spyOn<any>(store, 'seedMockData').and.callFake(() => Promise.resolve());
    const loadSpy = spyOn(store, 'loadJourneys').and.callFake(() => Promise.resolve());

    await store.resetAll();

    expect(clearSpy).toHaveBeenCalled();
    expect(seedSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('sollte alle Journeys in der DB ersetzen und den Signal-Status aktualisieren', async () => {
    const mockJourneys: Journey[] = [
      { id: 'j1', name: 'Test Journey 1', order: 1, steps: [] },
      { id: 'j2', name: 'Test Journey 2', order: 2, steps: [] }
    ];

    // JourneyDB.journeys mocken (nested DB-Zugriff)
    journeyDBMock.journeys = {
      clear: jasmine.createSpy().and.resolveTo(),
      bulkAdd: jasmine.createSpy().and.resolveTo()
    };

    // Signal-Status beobachten
    const journeysSignal = signal<Journey[]>([]);
    Object.defineProperty(store, '_journeys', {
      value: journeysSignal,
      writable: true
    });
    Object.defineProperty(store, 'journeys', {
      get: () => journeysSignal.asReadonly()
    });

    // Act
    await store.replaceAll(mockJourneys);

    // Assert
    expect(journeyDBMock.journeys.clear).toHaveBeenCalled();
    expect(journeyDBMock.journeys.bulkAdd).toHaveBeenCalledOnceWith(mockJourneys);
    expect(store.journeys()).toEqual(mockJourneys);
  });


});
