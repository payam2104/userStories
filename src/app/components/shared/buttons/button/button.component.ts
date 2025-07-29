import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' = 'submit';
  @Input() buttonLabel: string = "";
  @Input() isDisabled: boolean = false;
  @Output() callParentFunction = new EventEmitter();

  // Wird beim Klick auf den Button ausgeführt und triggert das Parent-Event
  callingFunction(): void {
    this.callParentFunction.emit();
  }
}
