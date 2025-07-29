import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { JourneyColumnComponent } from '../journey-column/journey-column.component';
import { UnassignedIssuesComponent } from '../../issues/unassigned-issues/unassigned-issues.component';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { Issue } from '../../../core/model/issue.model';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DataIOService } from '../../../core/services/data-io/data-io.service';
import { ButtonComponent } from "../../shared/buttons/button/button.component";

@Component({
  selector: 'app-story-map',
  standalone: true,
  imports: [
    CommonModule,
    JourneyColumnComponent,
    UnassignedIssuesComponent,
    ButtonComponent
],
  templateUrl: './story-map.component.html',
  styleUrls: ['./story-map.component.scss']
})
export class StoryMapComponent {
  // Signal, ob alle Drop-Listen (Steps + "Unassigned") im DOM verfügbar sind
  readonly dropListReady = signal(false);
  
  // Zählt, wie viele Journey-Spalten bereits fertig gerendert wurden
  renderedColumnsCount = 0;
  
  // Daten-Stores und Services
  readonly dataIO = inject(DataIOService);
  readonly journeyStore = inject(JourneyStore);
  readonly issueStore = inject(IssueStore);
  readonly releaseStore = inject(ReleaseStore);

  // Reactive Zugriffe auf Daten
  readonly journeys = this.journeyStore.journeys;
  readonly issues = computed(() => this.issueStore.issues());
  readonly releases = computed(() => this.releaseStore.releases());

  // Alle Step-IDs aus allen Journeys
  readonly allStepIds = computed(() =>
    this.journeys().flatMap(j => j.steps.map(s => s.id))
  );

  // Drop-Zonen: "unassigned" + alle Step-IDs
  readonly allDropListIds = computed(() => {
    const validStepIds = this.journeys().flatMap(j => j.steps.map(s => s.id));
    return ['unassigned', ...validStepIds];
  });

  constructor() {
    this.journeyStore.initFromDB(); // journeys
    this.releaseStore.initFromDB(); // wichtig: damit Releases von Anfang an da sind
  }

  // Gibt alle Issues zurück, die zu einem bestimmten Release gehören
  getIssuesForRelease = (releaseId: string): Issue[] => {
    if (!releaseId) return []; // oder if (releaseId == null)
    return this.issueStore.issues().filter(issue => issue.releaseId === releaseId);
  };

  /**
   * Wird von jeder Journey-Spalte nach Rendering aufgerufen
   * Sobald alle Spalten sichtbar sind, wird Drag & Drop aktiviert
   */
  onColumnRendered() {
    this.renderedColumnsCount++;
    if (this.renderedColumnsCount >= this.journeys().length) {
      this.dropListReady.set(true);
    }
  }

  // Allgemeiner Drop-Handler für Steps
  drop(event: CdkDragDrop<Issue[]>, stepId?: string) {
    const issue = event.item.data as Issue;

    if (!stepId) {
      this.issueStore.unassignCompletelyWithUndo(issue.id);
      return;
    }

    this.issueStore.assignToStep(issue.id, stepId);
  }

  // Drop aus der Spalte „Unassigned Issues“ – löscht Step- und Release-Zuweisung
  dropFromUnassigned(event: CdkDragDrop<Issue[]>) {
    const issue = event.item.data as Issue;
    // Komplett entfernen mit Undo (inkl. Release und Step)
    this.issueStore.unassignCompletelyWithUndo(issue.id);
  }

  // Drop aus einem Step in einen anderen – aktualisiert die Step-Zuweisung
  dropFromStep(event: CdkDragDrop<Issue[]>, stepId: string) {
    const issue = event.item.data as Issue;
    this.issueStore.assignToStep(issue.id, stepId);
  }

  // Exportiert alle Journeys, Issues und Releases als JSON-Datei
  exportJson() {
    const data = {
      journeys: this.journeys(),
      issues: this.issues(),
      releases: this.releases()
    };

    this.dataIO.exportToFile(data, 'storymap-export.json');
  }

  // Importiert eine Story Map aus einer JSON-Datei (struktur muss passen)
  async importJson(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    await this.dataIO.importFromFile(file);

    input.value = ''; // Zurücksetzen, falls dieselbe Datei nochmal geladen wird
  }

}

