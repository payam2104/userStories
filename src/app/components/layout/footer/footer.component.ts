import { Component, inject } from '@angular/core';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { ButtonComponent } from "../../shared/buttons/button/button.component";
import { DarkToggleComponent } from '../../shared/dark-toggle/dark-toggle.component';

@Component({
  selector: 'app-footer',
  imports: [ButtonComponent, DarkToggleComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private issueStore = inject(IssueStore);
  private journeyStore = inject(JourneyStore);
  private releaseStore = inject(ReleaseStore);

  // Setzt alle Daten in den Stores zurück (löscht Issues, Releases und Journeys aus IndexedDB)
  async resetData() {
    await this.issueStore.resetAll();
    await this.releaseStore.resetAll?.();
    await this.journeyStore.resetAll?.();
  }
}
