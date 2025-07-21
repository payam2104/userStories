import { inject, Injectable, computed, signal } from '@angular/core';
import { Release } from '../model/release.model';
import { ReleaseDB } from '../services/release-db.service';

@Injectable({ providedIn: 'root' })
export class ReleaseStore {
  private readonly releaseDB = inject(ReleaseDB);

  private readonly _releases = signal<Release[]>([]);
  readonly releases = this._releases.asReadonly();

  constructor() {
    this.loadFromDB();
  }

  async loadFromDB() {
    const all = await this.releaseDB.getAll();
    this._releases.set(all);
  }

  async createRelease(release: Release): Promise<void> {
    await this.releaseDB.add(release);

    this._releases.update(list => [...list, release]);
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
}
