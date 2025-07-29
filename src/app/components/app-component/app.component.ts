import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "../layout/header/header.component";
import { UndoSnackbarComponent } from '../shared/undo-snackbar/undo-snackbar.component';
import { FooterComponent } from "../layout/footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, UndoSnackbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'userStories';
}
