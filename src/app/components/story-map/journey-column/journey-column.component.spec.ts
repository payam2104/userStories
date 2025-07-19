import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JourneyColumnComponent } from './journey-column.component';

describe('JourneyColumnComponent', () => {
  let component: JourneyColumnComponent;
  let fixture: ComponentFixture<JourneyColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyColumnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JourneyColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
