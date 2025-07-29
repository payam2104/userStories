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
   * Exportiert beliebige Daten als JSON-Datei und startet einen automatischen Download.
   * @param data Die zu exportierenden Daten (z. B. Journeys, Issues, Releases)
   * @param filename Name der erzeugten Datei (Default: "data.json")
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
   * Liest eine JSON-Datei ein, parst sie und ersetzt die Daten in allen relevanten Stores.
   * @param file Die zu importierende Datei (z. B. vom <input type="file">)
   */
  async importFromFile(file: File): Promise<void> {
    const text = await file.text();
    const json = JSON.parse(text);

    if (!json.journeys || !json.issues) {
      alert('❌ Ungültige JSON-Datei. Es fehlen "journeys" oder "issues".');
      return;
    }

    // Vorhandene Daten durch importierte Daten ersetzen
    await this.journeyStore.replaceAll(json.journeys);
    await this.issueStore.replaceAll(json.issues);
    await this.releaseStore.replaceAll(json.releases)
  }
}
