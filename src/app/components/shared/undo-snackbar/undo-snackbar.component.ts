import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UndoService } from '../../../core/services/undo/undo.service';

@Component({
  selector: 'app-undo-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './undo-snackbar.component.html',
  styleUrls: ['./undo-snackbar.component.scss']
})
export class UndoSnackbarComponent {
  // Signal zur Steuerung, ob die Snackbar gerade ausgeblendet wird
  readonly isHiding = signal(false);

  // Zugriff auf den UndoService
  readonly undoService = inject(UndoService);

  // Aktuelle Undo-Aktion, falls vorhanden
  readonly undo = this.undoService.current;

  constructor() {
    // Reagiert auf Änderungen am UndoService (neue Aktion oder Dismiss-Wunsch)
    effect(() => {
      const current = this.undoService.current();
      const dismiss = this.undoService.onDismissRequest();
      const hiding = this.isHiding();

      // Wenn ein Dismiss angefordert wurde und die Snackbar noch sichtbar ist → starten
      if (dismiss && current && !hiding) {
        this.isHiding.set(true);
        return;
      }

      // Wenn eine neue Undo-Aktion eintrifft, während Snackbar versteckt ist → anzeigen
      if (!dismiss && current && hiding) {
        this.isHiding.set(false);
      }
    });
  }

  // Wird vom "Schließen"-Button aufgerufen – aktiviert das Dismiss-Signal
  hide() {
    this.undoService.requestHide();
  }

  // Nach Ende der Ausblend-Animation → Undo abschließen und Zustand zurücksetzen
  onAnimationEnd() {
    if (this.isHiding()) {
      queueMicrotask(() => {
        this.undoService.dismiss();
      });
    }
  }
}
