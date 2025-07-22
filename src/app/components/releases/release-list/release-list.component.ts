import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReleaseStore } from '../../../core/stores/release.store';
import { RouterModule } from '@angular/router';

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

    const count = this.releases().length + 1;
    const id = `release_${count.toString().padStart(3, '0')}`;

    await this.releaseStore.createRelease({
      id,
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim()
    });

    this.form.reset();
  }

  delete(id: string) {
    this.releaseStore.deleteRelease(id);
  }
}
