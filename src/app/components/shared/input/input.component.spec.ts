import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent],
  template: `
    <form [formGroup]="form">
      <app-input
        controlName="name"
        label="Name"
        placeholder="Vorname"
        [showError]="true"
      ></app-input>
    </form>
  `
})
class HostComponent {
  form = new FormGroup({
    name: new FormControl('')
  });
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let hostComponent: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sollte korrekt erstellt werden', () => {
    expect(hostComponent).toBeTruthy();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Vorname');
    expect(hostComponent.form.get('name')).toBeTruthy();
  });
});

