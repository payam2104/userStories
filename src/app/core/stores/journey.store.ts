import { Injectable, signal } from '@angular/core';
import { Journey } from '../model/journey.model';
import { Step } from '../model/step.model';
import { journeyDB } from '../services/journey-db.service';

@Injectable({ providedIn: 'root' })
export class JourneyStore {
  private readonly _journeys = signal<Journey[]>([]);
  readonly journeys = this._journeys.asReadonly();

  constructor() {}

  // Manueller Reset + Seeding + Laden
  async initFromDB() {
    await journeyDB.journeys.clear();             // DB leeren
    await journeyDB.seedInitialJourneys();        // JSON neu laden
    const refreshed = await journeyDB.getAll();   // aus DB lesen
    this._journeys.set(refreshed);                // im Signal setzen
  }

  setJourneys(journeys: Journey[]) {
    this._journeys.set(journeys);
  }

  updateJourney(updated: Journey) {
    this._journeys.update(journeys =>
      journeys.map(j => (j.id === updated.id ? updated : j))
    );
    // Optional: await journeyDB.journeys.put(updated);
  }

  addStepToJourney(journeyId: string, step: Step) {
    this._journeys.update(journeys =>
      journeys.map(j =>
        j.id === journeyId
          ? { ...j, steps: [...j.steps, step] }
          : j
      )
    );
    // Optional: await journeyDB.journeys.put(...)
  }
}

