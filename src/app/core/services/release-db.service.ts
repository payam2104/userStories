import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Release } from '../model/release.model';

@Injectable({ providedIn: 'root' })
export class ReleaseDB extends Dexie {
  releases!: Table<Release, string>;

  constructor() {
    super('ReleaseDatabase');
    this.version(1).stores({
      releases: 'id,name,description'
    });
  }

  async getAll(): Promise<Release[]> {
    return await this.releases.toArray();
  }

  async add(release: Release): Promise<void> {
    await this.releases.put(release);
  }

  async deleteRelease(id: string): Promise<void> {
    await this.releases.delete(id);
  }

  async clear(): Promise<void> {
    await this.releases.clear();
  }
}
