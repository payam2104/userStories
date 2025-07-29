import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }]
})
export class InputComponent {
  @Input() label?: string;
  @Input() type: string = 'text';
  @Input() controlName: string = '';
  @Input() placeholder?: string = '';
  @Input() showError?: boolean = false;

  // Eindeutige ID für das Input-Feld
  public inputId: string = `input_${uuidv4()}`;
}
