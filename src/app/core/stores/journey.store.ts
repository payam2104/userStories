import { Injectable, computed, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Journey } from '../model/journey.model';
import { JourneyDB } from '../services/journey-db.service';
import { Step } from '../model/step.model';

@Injectable({ providedIn: 'root' })
export class JourneyStore {
  private readonly _journeys = signal<Journey[]>([]);
  readonly journeys = this._journeys.asReadonly();

  constructor(private journeyDB: JourneyDB) {
    this.loadJourneys();
  }

  // Initialer Seed & Load bei App-Start (falls DB leer)
  initFromDB(): Promise<void> {
    return this.journeyDB.seedInitialJourneys().then(() => this.loadJourneys());
  }

  // Journeys aus der IndexedDB laden
  async loadJourneys(): Promise<void> {
    const all = await this.journeyDB.getAll();
    // Hier explizit nach `order` sortieren
    all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._journeys.set(all);
  }

  // Einzelnen Journey holen
  getJourneyById = (id: string) => computed(() =>
    this._journeys().find(j => j.id === id)
  );

  // Alle Steps aus allen Journeys
  getAllSteps(): Step[] {
    return this._journeys().flatMap(j => j.steps);
  }

  // Journey hinzufügen
  async addJourney(journey: Journey): Promise<void> {
    await this.journeyDB.addJourney(journey);
    await this.loadJourneys();
  }

  // Step zu einem Journey hinzufügen
  async addStep(journeyId: string, step: Step): Promise<void> {
    await this.journeyDB.addStep(journeyId, step);
    await this.loadJourneys();
  }

  // Seed aus assets/data/journeys.seed.json
  private async seedMockData(): Promise<void> {
    const response = await fetch('assets/data/journeys.seed.json');
    const journeys: Journey[] = await response.json();

    const withUUIDs = journeys.map(j => ({
      ...j,
      id: j.id || uuidv4(),
      steps: j.steps.map(step => ({
        ...step,
        id: step.id || uuidv4()
      }))
    }));

    // Optional: explizit nach `order` sortieren (falls Daten nicht sortiert ankommen)
    withUUIDs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    await this.journeyDB.addJourneys(withUUIDs);
  }

  // Optional manuelles Setzen
  setJourneys(journeys: Journey[]) {
    this._journeys.set(journeys);
  }

  // Alle Daten zurücksetzen + seeden
  async resetAll(): Promise<void> {
    await this.journeyDB.clear();
    await this.seedMockData();       // ⬅️ Seed aus JSON
    await this.loadJourneys();
  }
}
