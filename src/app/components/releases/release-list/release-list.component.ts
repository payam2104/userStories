import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { Release } from '../../../core/model/release.model';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from "../../shared/buttons/button/button.component";

@Component({
  selector: 'app-release-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, InputComponent, ButtonComponent],
  templateUrl: './release-list.component.html',
  styleUrls: ['./release-list.component.scss']
})
export class ReleaseListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly releaseStore = inject(ReleaseStore);

  public form: FormGroup;
  public releases: Signal<Release[]>;

  constructor() {
    this.releases = this.releaseStore.releases;

    // Initialisierung des Formulars mit Validierung (Name erforderlich, min. 2 Zeichen)
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  // Legt ein neues Release an, wenn das Formular gültig ist
  async create() {
    if (this.form.invalid) return;

    await this.releaseStore.createRelease({
      id: uuidv4(),
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim()
    });

    this.form.reset();
  }

  // Löscht ein Release mit Undo-Option über den Store
  deleteWithUndo(release: Release) {
    this.releaseStore.deleteReleaseWithUndo(release);
  }
}
