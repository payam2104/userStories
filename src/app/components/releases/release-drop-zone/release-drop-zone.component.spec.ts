import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseDropZoneComponent } from './release-drop-zone.component';

describe('ReleaseDropZoneComponent', () => {
  let component: ReleaseDropZoneComponent;
  let fixture: ComponentFixture<ReleaseDropZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseDropZoneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleaseDropZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
