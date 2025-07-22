import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Journey } from '../model/journey.model';
import { Step } from '../model/step.model';

@Injectable({ providedIn: 'root' })
export class JourneyDB extends Dexie {
  journeys!: Table<Journey, string>;

  constructor() {
    super('JourneyDatabase');

    this.version(1).stores({
      journeys: 'id,name'
    });
  }

  // Journeys aus seed-Datei laden (z. B. beim App-Start)
  async seedInitialJourneys(): Promise<void> {
    const count = await this.journeys.count();
    if (count === 0) {
      try {
        const res = await fetch('assets/data/journeys.seed.json');
        if (!res.ok) {
          throw new Error(`Seed-Datei konnte nicht geladen werden (Status: ${res.status})`);
        }
        const data: Journey[] = await res.json();
        await this.journeys.bulkPut(data);
      } catch (error) {
        console.error('Fehler beim Laden der Seed-Daten:', error);
      }
    }
  }

  // Alle Journeys abrufen
  async getAll(): Promise<Journey[]> {
    return this.journeys.toArray();
  }

  // Einzelne Journey hinzufügen
  async addJourney(journey: Journey): Promise<void> {
    await this.journeys.put(journey);
  }

  // Mehrere Journeys gleichzeitig hinzufügen
  async addJourneys(journeys: Journey[]): Promise<void> {
    await this.journeys.bulkPut(journeys);
  }

  // Step zu einem Journey hinzufügen
  async addStep(journeyId: string, step: Step): Promise<void> {
    const journey = await this.journeys.get(journeyId);
    if (!journey) return;

    journey.steps = [...journey.steps, step];
    await this.journeys.put(journey);
  }

  // Alle Journeys löschen (z. B. für reset)
  async clear(): Promise<void> {
    await this.journeys.clear();
  }
}
