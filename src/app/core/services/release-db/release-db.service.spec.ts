import { ReleaseDB } from './release-db.service';
import { Release } from '../../model/release.model';

describe('ReleaseDB Service', () => {
  let db: ReleaseDB;

  const mockRelease: Release = {
    id: 'r1',
    name: 'Release 1',
    description: 'Testrelease'
  };

  beforeEach(async () => {
    db = new ReleaseDB();
    await db.clear(); // wichtig: vorher immer aufräumen
  });

  afterEach(async () => {
    await db.delete(); // schließt und löscht die DB (nur für Tests)
  });

  it('sollte die DB korrekt initialisieren', () => {
    expect(db).toBeTruthy();
    expect(db.releases).toBeDefined();
  });

  it('sollte ein Release hinzufügen und abrufen können', async () => {
    await db.add(mockRelease);
    const all = await db.getAll();
    expect(all.length).toBe(1);
    expect(all[0]).toEqual(mockRelease);
  });

  it('sollte mehrere Releases hinzufügen und korrekt abrufen', async () => {
    const releases: Release[] = [
      mockRelease,
      { id: 'r2', name: 'Release 2', description: 'Zweiter Release' }
    ];
    for (const r of releases) {
      await db.add(r);
    }

    const result = await db.getAll();
    expect(result.length).toBe(2);
    expect(result.map(r => r.id)).toContain('r1');
    expect(result.map(r => r.id)).toContain('r2');
  });

  it('sollte ein Release löschen', async () => {
    await db.add(mockRelease);
    await db.deleteRelease('r1');
    const all = await db.getAll();
    expect(all.length).toBe(0);
  });

  it('sollte alle Releases löschen mit clear()', async () => {
    await db.add(mockRelease);
    await db.clear();
    const all = await db.getAll();
    expect(all).toEqual([]);
  });

  it('sollte ein Release überschreiben, wenn gleiche ID verwendet wird', async () => {
    await db.add(mockRelease);
    const updated: Release = { ...mockRelease, name: 'Updated Name' };
    await db.add(updated);
    const all = await db.getAll();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Updated Name');
  });
});
