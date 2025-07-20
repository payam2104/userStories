import { Injectable, signal } from '@angular/core';
import { Journey } from '../model/journey.model';
import { Step } from '../model/step.model';
import { JourneyDB } from '../services/journey-db.service';

@Injectable({ providedIn: 'root' })
export class JourneyStore {
  private readonly _journeys = signal<Journey[]>([]);
  readonly journeys = this._journeys.asReadonly();

  constructor(private journeyDB: JourneyDB) { }

  // Manueller Reset + Seeding + Laden
  async initFromDB() {
    await this.journeyDB.journeys.clear();             // DB leeren
    await this.journeyDB.seedInitialJourneys();        // JSON neu laden
    const refreshed = await this.journeyDB.getAll();   // aus DB lesen
    // im Signal setzen
    this._journeys.set(
      refreshed.sort((a, b) => (a as any).order - (b as any).order)
    );
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

