import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryMapComponent } from './story-map.component';

describe('StoryMapComponent', () => {
  let component: StoryMapComponent;
  let fixture: ComponentFixture<StoryMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
