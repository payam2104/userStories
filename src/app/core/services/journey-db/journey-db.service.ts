import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Journey } from '../../model/journey.model';
import { Step } from '../../model/step.model';

@Injectable({ providedIn: 'root' })
export class JourneyDB extends Dexie {
  // Tabelle für Journey-Einträge, Primärschlüssel ist die ID
  journeys!: Table<Journey, string>;

  constructor() {
    super('JourneyDatabase');

    this.version(1).stores({
      journeys: 'id,name'
    });
  }

  /**
   * Lädt Initialdaten aus einer JSON-Seed-Datei (nur wenn die Datenbank leer ist).
   * Quelle: assets/data/journeys.seed.json
   */
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

  /**
   * Gibt alle gespeicherten Journeys als Array zurück.
   */
  async getAll(): Promise<Journey[]> {
    return this.journeys.toArray();
  }

  /**
   * Fügt eine neue Journey in die Datenbank ein oder aktualisiert sie.
   * 
   * @param journey - Das Journey-Objekt, das hinzugefügt oder überschrieben werden soll.
   */
  async addJourney(journey: Journey): Promise<void> {
    await this.journeys.put(journey);
  }

  /**
   * Fügt mehrere Journeys gleichzeitig ein oder aktualisiert sie (Bulk-Operation).
   * 
   * @param journeys - Array von Journey-Objekten zur Speicherung.
   */
  async addJourneys(journeys: Journey[]): Promise<void> {
    await this.journeys.bulkPut(journeys);
  }

  /**
   * Fügt einem bestehenden Journey ein neues Step-Objekt hinzu.
   * 
   * @param journeyId - Die ID der Journey, zu der der Step hinzugefügt werden soll.
   * @param step - Das neue Step-Objekt.
   */
  async addStep(journeyId: string, step: Step): Promise<void> {
    const journey = await this.journeys.get(journeyId);
    if (!journey) return;

    journey.steps = [...journey.steps, step];
    await this.journeys.put(journey);
  }

  /**
   * Löscht alle Journeys aus der Datenbank
   */
  async clear(): Promise<void> {
    await this.journeys.clear();
  }
}
