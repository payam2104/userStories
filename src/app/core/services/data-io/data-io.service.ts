import { Injectable, inject } from '@angular/core';
import { JourneyStore } from '../../stores/journey/journey.store';
import { IssueStore } from '../../stores/issue/issue.store';
import { ReleaseStore } from '../../stores/release/release.store';

@Injectable({ providedIn: 'root' })
export class DataIOService {
  private readonly journeyStore = inject(JourneyStore);
  private readonly issueStore = inject(IssueStore);
  private readonly releaseStore = inject(ReleaseStore);

  /**
   * Exportiert die aktuelle User Story Map als JSON-Blob und löst den Download aus.
   */
  exportToFile(data: any, filename: string = 'data.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Importiert User Story Map aus einer JSON-Datei und ersetzt bestehende Daten.
   */
  async importFromFile(file: File): Promise<void> {
    const text = await file.text();
    const json = JSON.parse(text);

    if (!json.journeys || !json.issues) {
      alert('❌ Ungültige JSON-Datei. Es fehlen "journeys" oder "issues".');
      return;
    }

    // Ersetze Daten in den Stores
    await this.journeyStore.replaceAll(json.journeys);
    await this.issueStore.replaceAll(json.issues);
    await this.releaseStore.replaceAll(json.releases)
  }
}
