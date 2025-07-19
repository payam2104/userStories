import Dexie, { Table } from 'dexie';
import { Journey } from '../model/journey.model';

export class JourneyDB extends Dexie {
  journeys!: Table<Journey, string>;

  constructor() {
    super('JourneyDatabase');

    this.version(1).stores({
      journeys: 'id,title' // falls du steps durchsuchen willst, hier erweitern
    });
  }

  // Seed aus JSON-Datei laden (einmalig)
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

  // optional: z. B. delete, updateJourney usw.
}

export const journeyDB = new JourneyDB();
