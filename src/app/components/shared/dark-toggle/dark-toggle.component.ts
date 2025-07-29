import { Component, signal } from '@angular/core';
import { ButtonComponent } from '../buttons/button/button.component';


@Component({
  selector: 'app-dark-toggle',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './dark-toggle.component.html',
  styleUrl: './dark-toggle.component.scss'
})
export class DarkToggleComponent {
  // Reaktives Signal zur Steuerung des Dark Modes (initialer Zustand wird aus localStorage gelesen)
  private isDarkSignal = signal<boolean>(localStorage.getItem('dark') === 'true');
  
  // Gibt den Button-Text basierend auf aktuellem Modus zurück
  label = () => this.isDarkSignal() ? 'Light Mode' : 'Dark Mode';

  // Wechselt zwischen Dark und Light Mode, speichert Einstellung im localStorage
  toggle() {
    const html = document.documentElement;
    const isDark = !this.isDarkSignal();
    this.isDarkSignal.set(isDark);
    localStorage.setItem('dark', String(isDark));
    html.classList.toggle('dark', isDark);
  }

  // Setzt Mode beim Initialisieren der Komponente anhand des Signals
  ngOnInit() {
    document.documentElement.classList.toggle('dark', this.isDarkSignal());
  }
}
