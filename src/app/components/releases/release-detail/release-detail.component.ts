import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReleaseStore } from '../../../core/stores/release.store';
import { Release } from '../../../core/model/release.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-release-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './release-detail.component.html',
  styleUrls: ['./release-detail.component.scss'],
})
export class ReleaseDetailComponent implements OnInit {
  form!: FormGroup;
  releaseId!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: ReleaseStore
  ) {}

  ngOnInit(): void {
    this.releaseId = this.route.snapshot.paramMap.get('id')!;
    const release = this.store.getReleaseById(this.releaseId)();

    if (!release) {
      this.router.navigate(['/releases']);
      return;
    }

    this.form = this.fb.group({
      name: [release.name, Validators.required],
      description: [release.description],
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;

    const updatedRelease: Release = {
      id: this.releaseId,
      ...this.form.value,
    };

    await this.store.updateRelease(updatedRelease); // Replaces existing
    this.router.navigate(['/releases']);
  }

  cancel(): void {
    this.router.navigate(['/releases']);
  }
}
