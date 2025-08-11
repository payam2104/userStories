import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterLink } from '@angular/router';
import { NavButtonComponent } from './nav-button.component';

describe('NavButtonComponent', () => {
  let fixture: ComponentFixture<NavButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Standalone: importiere die benötigten Direktiven explizit
      imports: [NavButtonComponent, RouterLink],
      providers: [
        // ersetzt RouterTestingModule / RouterTestingModule.withRoutes([])
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavButtonComponent);
    const component = fixture.componentInstance;
    component.buttonLabel = 'Weiter';
    component.navRouterLink = '/next-page';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render link with correct label and href', () => {
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(anchor.textContent?.trim()).toBe('Weiter');
    expect(anchor.getAttribute('href') ?? '').toContain('/next-page');
  });
});
