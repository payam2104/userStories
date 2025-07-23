import { Injectable, signal } from '@angular/core';
import { UndoAction } from '../model/undo-action.model';

@Injectable({ providedIn: 'root' })
export class UndoService {
  // Aktuelle Undo-Aktion (null wenn keine aktiv ist), verwaltet über Signals.
  private readonly _current = signal<UndoAction | null>(null);
  // Nur lesender Zugriff auf die aktuelle Undo-Aktion.
  readonly current = this._current.asReadonly();

  // Signal, das gesetzt wird, wenn die Snackbar ausgeblendet werden soll
  private readonly _onDismissRequest = signal(false);
  readonly onDismissRequest = this._onDismissRequest.asReadonly();

  /**
   * Zeigt eine neue Undo-Aktion an und startet den Auto-Dismiss-Timer.
   * @param description Beschreibung der Aktion für die Snackbar
   * @param undoFn Funktion, die die Aktion rückgängig macht
   * @param duration Zeit in Millisekunden bis automatische Ausblendung
   */
  showUndo(description: string, undoFn: () => void, duration = 10000) {
    this.clear();
    const timeoutId = setTimeout(() => {
      this.requestHide();
    }, duration);
    this._current.set({ description, undoFn, timeoutId });
  }

  /**
   * Führt die Undo-Aktion aus und entfernt sie aus dem State.
   */
  undo() {
    const current = this._current();
    if (current) {
      clearTimeout(current.timeoutId);
      current.undoFn();
      this.requestHide();
    }
  }

  /**
   * Schließt die Snackbar ohne die Aktion rückgängig zu machen.
   */
  dismiss() {
    this.clear();
    this._onDismissRequest.set(false); // Reset für nächsten Einsatz
  }

  /**
   * Startet das animierte Verstecken (z. B. bei Timeout oder Undo).
   */
  requestHide() {
    this._onDismissRequest.set(true);
  }

  /**
   * Entfernt die aktuelle Undo-Aktion aus dem Signal-State.
   */
  private clear() {
    const current = this._current();
    if (current?.timeoutId) {
      clearTimeout(current.timeoutId);
    }
    this._current.set(null);
  }


}
