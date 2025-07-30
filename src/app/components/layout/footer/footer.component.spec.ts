import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { ButtonComponent } from '../../shared/buttons/button/button.component';
import { DarkToggleComponent } from '../../shared/dark-toggle/dark-toggle.component';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { IssueStore } from '../../../core/stores/issue/issue.store';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  // Mock-Implementierungen für die Stores
  const mockIssueStore = {
    resetAll: jasmine.createSpy('resetAll').and.resolveTo(undefined)
  };
  const mockReleaseStore = {
    resetAll: jasmine.createSpy('resetAll').and.resolveTo(undefined)
  };
  const mockJourneyStore = {
    resetAll: jasmine.createSpy('resetAll').and.resolveTo(undefined)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, ButtonComponent, DarkToggleComponent],
      providers: [
        { provide: IssueStore, useValue: mockIssueStore },
        { provide: ReleaseStore, useValue: mockReleaseStore },
        { provide: JourneyStore, useValue: mockJourneyStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call resetAll() on all stores when resetData() is called', async () => {
    await component.resetData();

    expect(mockIssueStore.resetAll).toHaveBeenCalledTimes(1);
    expect(mockReleaseStore.resetAll).toHaveBeenCalledTimes(1);
    expect(mockJourneyStore.resetAll).toHaveBeenCalledTimes(1);
  });
});
