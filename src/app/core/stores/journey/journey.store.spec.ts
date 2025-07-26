import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JourneyStore } from './journey.store';
import { JourneyDB } from '../../services/journey-db/journey-db.service';
import { Journey } from '../../model/journey.model';
import { signal } from '@angular/core';

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

    // 🧠 internen Signal-Status manuell setzen
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

  it('gibt das richtige Journey für eine gültige ID zurück', () => {
    // Arrange
    const journeys: Journey[] = [
      { id: 'a', name: 'A', steps: [], order: 1 },
      { id: 'b', name: 'B', steps: [], order: 2 }
    ];
    store.setJourneys(journeys);

    // Act
    const result = store.getJourneyById('b');

    // Assert
    expect(result()).toEqual(journeys[1]);
  });

  it('gibt undefined zurück, wenn die ID nicht existiert', () => {
    store.setJourneys([
      { id: 'x', name: 'X', steps: [], order: 1 }
    ]);
    const result = store.getJourneyById('not-found');
    expect(result()).toBeUndefined();
  });

  it('gibt alle Steps aus allen Journeys zurück', () => {
    const journeys: Journey[] = [
      {
        id: 'j1',
        name: 'Journey 1',
        order: 1,
        steps: [
          { id: 's1', name: 'Step 1', user_journey_id: 'j1' },
          { id: 's2', name: 'Step 2', user_journey_id: 'j1' }
        ]
      },
      {
        id: 'j2',
        name: 'Journey 2',
        order: 2,
        steps: [
          { id: 's3', name: 'Step 3', user_journey_id: 'j2' }
        ]
      }
    ];

    store.setJourneys(journeys);

    const allSteps = store.getAllSteps();

    expect(allSteps).toEqual([
      { id: 's1', name: 'Step 1', user_journey_id: 'j1' },
      { id: 's2', name: 'Step 2', user_journey_id: 'j1' },
      { id: 's3', name: 'Step 3', user_journey_id: 'j2' }
    ]);
  });

  it('gibt eine leere Liste zurück, wenn keine Journeys vorhanden sind', () => {
    store.setJourneys([]);
    expect(store.getAllSteps()).toEqual([]);
  });

  it('ignoriert Journeys ohne Steps', () => {
    const journeys: Journey[] = [
      { id: 'j1', name: 'Empty', steps: [], order: 1 },
      {
        id: 'j2',
        name: 'With Steps',
        order: 2,
        steps: [
          { id: 's1', name: 'Step 1', user_journey_id: 'j2' }
        ]
      }
    ];

    store.setJourneys(journeys);
    expect(store.getAllSteps()).toEqual([
      { id: 's1', name: 'Step 1', user_journey_id: 'j2' }
    ]);
  });

  it('fügt ein Journey hinzu und lädt danach alle Journeys neu', async () => {
    const newJourney: Journey = {
      id: 'j100',
      name: 'Neues Journey',
      order: 99,
      steps: []
    };

    const loadSpy = spyOn(store, 'loadJourneys').and.callFake(() => Promise.resolve());

    await store.addJourney(newJourney);

    expect(journeyDBMock.addJourney).toHaveBeenCalledOnceWith(newJourney);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('fügt einen Step zu einem Journey hinzu und lädt danach alle Journeys neu', fakeAsync(async () => {
    const journeyId = 'j1';
    const newStep = {
      id: 's123',
      name: 'Neuer Step',
      user_journey_id: journeyId
    };

    // Arrange
    const addStepSpy = journeyDBMock.addStep.and.resolveTo();
    const loadSpy = spyOn(store, 'loadJourneys').and.callFake(() => Promise.resolve());

    // Act
    await store.addStep(journeyId, newStep);
    tick();

    // Assert
    expect(addStepSpy).toHaveBeenCalledOnceWith(journeyId, newStep);
    expect(loadSpy).toHaveBeenCalled();
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

    // 🧪 fetch() mocken
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

  it('setzt den internen Journey-Signal-Status korrekt mit setJourneys()', () => {
    const mockJourneys: Journey[] = [
      {
        id: 'j1',
        name: 'Journey 1',
        order: 1,
        steps: []
      },
      {
        id: 'j2',
        name: 'Journey 2',
        order: 2,
        steps: []
      }
    ];

    // Vorbereitung: eigenes Signal, damit wir den Effekt prüfen können
    const journeysSignal = signal<Journey[]>([]);
    Object.defineProperty(store, '_journeys', {
      value: journeysSignal,
      writable: true
    });
    Object.defineProperty(store, 'journeys', {
      get: () => journeysSignal.asReadonly()
    });

    // Act
    store.setJourneys(mockJourneys);

    // Assert
    expect(store.journeys()).toEqual(mockJourneys);
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
