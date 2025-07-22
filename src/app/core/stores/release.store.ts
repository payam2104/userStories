import { inject, Injectable, computed, signal } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Release } from '../model/release.model';
import { ReleaseDB } from '../services/release-db.service';

@Injectable({ providedIn: 'root' })
export class ReleaseStore {

  private readonly _releases = signal<Release[]>([]);
  readonly releases = this._releases.asReadonly();

  constructor(private releaseDB: ReleaseDB) {
    this.loadFromDB();
  }

  async loadFromDB() {
    const all = await this.releaseDB.getAll();
    this._releases.set(all);
  }

  async createRelease(release: Release): Promise<void> {
    const completeRelease: Release = {
      ...release,
      id: release.id || uuidv4()
    };
    await this.releaseDB.add(completeRelease);
    await this.loadFromDB(); // 🧠 direkt neu laden statt manuell hinzufügen
  }


  async updateRelease(updated: Release): Promise<void> {
    await this.releaseDB.releases.put(updated); // richtig: direkt auf releases-Table

    this._releases.update(list => {
      return list.map(r => (r.id === updated.id ? updated : r));
    });
  }


  async deleteRelease(id: string) {
    await this.releaseDB.deleteRelease(id);
    this._releases.update(list => list.filter(r => r.id !== id));
  }

  getReleaseById = (id: string) => computed(() =>
    this._releases().find(r => r.id === id)
  );

  async initFromDB() {
    await this.loadFromDB();
  }


  // Daten zurücksetzen
  async resetAll() {
    await this.releaseDB.releases.clear();
    await this.initFromDB();
  }
}
