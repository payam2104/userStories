import { TestBed } from '@angular/core/testing';
import { JourneyDB } from './journey-db.service';
import { Journey } from '../../model/journey.model';
import { Step } from '../../model/step.model';

describe('JourneyDB', () => {
  let service: JourneyDB;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new JourneyDB();
  });

  afterEach(async () => {
    await service.delete();
  });

  it('sollte den Service erfolgreich erstellen', () => {
    expect(service).toBeTruthy();
  });

  it('sollte Seed-Daten laden, wenn die Datenbank leer ist', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(
      JSON.stringify([{ id: 'seed1', name: 'Seed Journey', steps: [] }])
    ));

    await service.seedInitialJourneys();
    const all = await service.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].id).toBe('seed1');
  });

  it('sollte keine Seed-Daten laden, wenn bereits Daten vorhanden sind', async () => {
    await service.addJourney({ id: 'existing', name: 'Existing', steps: [] });

    const fetchSpy = spyOn(window, 'fetch');
    await service.seedInitialJourneys();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sollte einen Fehler werfen, wenn die Seed-Datei nicht geladen werden kann', async () => {
    spyOn(service.journeys, 'count').and.resolveTo(0);
    spyOn(window, 'fetch').and.resolveTo({
      ok: false,
      status: 404
    } as Response);
    const consoleErrorSpy = spyOn(console, 'error');

    await service.seedInitialJourneys();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Fehler beim Laden der Seed-Daten:',
      jasmine.any(Error)
    );
  });

  it('sollte einen Fehler loggen, wenn fetch einen Fehler wirft', async () => {
    spyOn(service.journeys, 'count').and.resolveTo(0);
    spyOn(window, 'fetch').and.rejectWith(new Error('fetch failed'));
    const consoleErrorSpy = spyOn(console, 'error');

    await service.seedInitialJourneys();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Fehler beim Laden der Seed-Daten:',
      jasmine.any(Error)
    );
  });

  it('sollte eine Journey hinzufügen und abrufen', async () => {
    const journey: Journey = {
      id: 'j1',
      name: 'Test Journey',
      steps: []
    };

    await service.addJourney(journey);
    const all = await service.getAll();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].id).toBe('j1');
  });

  it('sollte mehrere Journeys hinzufügen', async () => {
    const journeys: Journey[] = [
      { id: 'j1', name: 'Journey 1', steps: [] },
      { id: 'j2', name: 'Journey 2', steps: [] }
    ];

    await service.addJourneys(journeys);
    const all = await service.getAll();
    expect(all.length).toBe(2);
  });

  it('sollte einen Step zu einer Journey hinzufügen', async () => {
    const journey: Journey = {
      id: 'j1',
      name: 'With Steps',
      steps: []
    };
    const step: Step = {
      id: 's1',
      name: 'Step 1',
      user_journey_id: 'userJourneyId1'
    };

    await service.addJourney(journey);
    await service.addStep('j1', step);
    const updated = await service.journeys.get('j1');
    expect(updated?.steps.length).toBe(1);
    expect(updated?.steps[0].name).toBe('Step 1');
  });

  it('sollte alle Journeys löschen', async () => {
    await service.addJourney({ id: 'j1', name: 'Test', steps: [] });
    await service.clear();
    const all = await service.getAll();
    expect(all.length).toBe(0);
  });

  it('sollte keinen Fehler werfen, wenn Journey beim Step-Hinzufügen nicht gefunden wird', async () => {
    const step: Step = {
      id: 's1',
      name: 'Verwaister Step',
      user_journey_id: 'irgendwas'
    };

    // Versuch, Step zu nicht existierender Journey hinzuzufügen
    await service.addStep('nicht-vorhanden', step);
    const all = await service.getAll();
    expect(all.length).toBe(0); // Keine Journey vorhanden
  });

});
