import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-button',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './nav-button.component.html',
  styleUrl: './nav-button.component.scss'
})
export class NavButtonComponent {
  @Input() buttonLabel: string = '';
  @Input() navRouterLink: string = ''
  
}
