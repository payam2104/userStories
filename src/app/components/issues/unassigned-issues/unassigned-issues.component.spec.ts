import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedIssuesComponent } from './unassigned-issues.component';

describe('UnassignedIssuesComponent', () => {
  let component: UnassignedIssuesComponent;
  let fixture: ComponentFixture<UnassignedIssuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnassignedIssuesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnassignedIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
