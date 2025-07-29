import { Injectable, inject, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Journey } from '../../model/journey.model';
import { JourneyDB } from '../../services/journey-db/journey-db.service';

// Globaler Store zur Verwaltung der Journeys und zugehörigen Steps.
// Nutzt Angular Signals für reaktiven State und Dexie-basierte Persistenz über JourneyDB.
@Injectable({ providedIn: 'root' })
export class JourneyStore {
  private readonly journeyDB = inject(JourneyDB);

  // Interner Signal-State für alle Journeys
  private readonly _journeys = signal<Journey[]>([]);
  // Öffentlicher readonly-Zugriff auf den Signal-State
  readonly journeys = this._journeys.asReadonly();

  /**
   * Initialisiert die Journey-Datenbank beim App-Start.
   * Führt nur ein Seeding durch, wenn die Datenbank leer ist.
   */
  async initFromDB(): Promise<void> {
    await this.journeyDB.seedInitialJourneys();
    await this.loadJourneys();
  }

  /**
   * Lädt alle Journeys aus der IndexedDB und sortiert sie nach `order`.
   */
  async loadJourneys(): Promise<void> {
    const all = await this.journeyDB.getAll();
    // Hier explizit nach `order` sortieren
    all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this._journeys.set(all);
  }

  /**
   * Führt ein Seeding aus einer externen JSON-Datei durch und vergibt UUIDs.
   * Quelle: assets/data/journeys.seed.json
   */
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

  /**
   * Setzt alle Journeys zurück:
   * 1. Löscht Datenbankeinträge
   * 2. Lädt neuen Seed
   * 3. Aktualisiert den Store-State
   */
  async resetAll(): Promise<void> {
    await this.journeyDB.clear();
    await this.seedMockData();       // ⬅Seed aus JSON
    await this.loadJourneys();
  }

  /**
   * Ersetzt alle Journeys in der Datenbank durch eine neue Liste.
   * Aktualisiert auch den Signal-Store.
   *
   * @param journeys - Neue Journeys zur Übernahme
   */
  async replaceAll(journeys: Journey[]) {
    await this.journeyDB.journeys.clear();
    await this.journeyDB.journeys.bulkAdd(journeys);
    this._journeys.set(journeys);
  }

}
