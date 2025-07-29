import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Release } from '../../model/release.model';

@Injectable({ providedIn: 'root' })
export class ReleaseDB extends Dexie {
  // Tabelle für Release-Einträge, Primärschlüssel ist die ID (string)
  releases!: Table<Release, string>;

  constructor() {
    super('ReleaseDatabase');

    // Datenbankschema: Index auf id, name und description
    this.version(1).stores({
      releases: 'id,name,description'
    });
  }

  /**
   * Gibt alle Releases aus der Datenbank als Array zurück.
   */
  async getAll(): Promise<Release[]> {
    return await this.releases.toArray();
  }

  /**
   * Fügt ein neues Release ein oder aktualisiert ein bestehendes mit gleicher ID.
   *
   * @param release - Das Release-Objekt, das gespeichert werden soll.
   */
  async add(release: Release): Promise<void> {
    await this.releases.put(release);
  }

  /**
   * Löscht ein Release anhand seiner ID.
   *
   * @param id - Die ID des Releases, das entfernt werden soll.
   */
  async deleteRelease(id: string): Promise<void> {
    await this.releases.delete(id);
  }

  /**
   * Entfernt alle Releases aus der Datenbank (z. B. bei Zurücksetzen).
   */
  async clear(): Promise<void> {
    await this.releases.clear();
  }
}
