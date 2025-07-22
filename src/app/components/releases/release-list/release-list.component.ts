import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { ReleaseStore } from '../../../core/stores/release.store';

@Component({
  selector: 'app-release-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './release-list.component.html',
  styleUrls: ['./release-list.component.scss']
})
export class ReleaseListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly releaseStore = inject(ReleaseStore);
  readonly releases = this.releaseStore.releases;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: ['']
  });

  async create() {
    if (this.form.invalid) return;

    await this.releaseStore.createRelease({
      id: uuidv4(),
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim()
    });

    this.form.reset();
  }

  delete(id: string) {
    this.releaseStore.deleteRelease(id);
  }
}
