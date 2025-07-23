import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ReleaseStore } from '../../../core/stores/release.store';
import { Release } from '../../../core/model/release.model';

@Component({
  selector: 'app-release-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './release-list.component.html',
  styleUrls: ['./release-list.component.scss']
})
export class ReleaseListComponent {
  public form: FormGroup;
  public releases: Signal<Release[]>;
  
  constructor(
    private fb: FormBuilder,
    private releaseStore: ReleaseStore
  ) {
    this.releases = this.releaseStore.releases;
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  async create() {
    if (this.form.invalid) return;

    await this.releaseStore.createRelease({
      id: uuidv4(),
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim()
    });

    this.form.reset();
  }

  delete(releaseId: string) {
    this.releaseStore.deleteRelease(releaseId);
  }

  deleteWithUndo(release: Release) {
    this.releaseStore.deleteReleaseWithUndo(release);
  }
}
