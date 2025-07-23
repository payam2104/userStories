import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UndoSnackbarComponent } from './undo-snackbar.component';

describe('UndoSnackbarComponent', () => {
  let component: UndoSnackbarComponent;
  let fixture: ComponentFixture<UndoSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UndoSnackbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UndoSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
