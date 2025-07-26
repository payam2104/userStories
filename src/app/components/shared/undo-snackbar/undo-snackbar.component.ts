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
  readonly isHiding = signal(false);
  readonly undoService = inject(UndoService);
  readonly undo = this.undoService.current;

  constructor() {
    effect(() => {
      const current = this.undoService.current();
      const dismiss = this.undoService.onDismissRequest();
      const hiding = this.isHiding();

      // 1. Wenn dismiss gewünscht ist und noch nicht versteckt → starten
      if (dismiss && current && !hiding) {
        this.isHiding.set(true);
        return;
      }

      // 2. Wenn neue Undo-Aktion kommt während es versteckt ist → wieder sichtbar machen
      if (!dismiss && current && hiding) {
        this.isHiding.set(false);
      }
    });
  }

  hide() {
    // das aktiviert das Dismiss-Signal
    this.undoService.requestHide();
  }

  onAnimationEnd() {
    if (this.isHiding()) {
      // kein weiteres Signal hier setzen
      queueMicrotask(() => {
        this.undoService.dismiss();
        this.isHiding.set(false); // wieder zurücksetzen
      });
    }
  }
}
