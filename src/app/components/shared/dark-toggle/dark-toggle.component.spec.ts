import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DarkToggleComponent } from './dark-toggle.component';

describe('DarkToggleComponent', () => {
  let component: DarkToggleComponent;
  let fixture: ComponentFixture<DarkToggleComponent>;
  let html: HTMLElement;

  beforeEach(async () => {
    // Vorheriger Zustand im localStorage bereinigen
    localStorage.removeItem('dark');

    await TestBed.configureTestingModule({
      imports: [DarkToggleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DarkToggleComponent);
    component = fixture.componentInstance;
    html = document.documentElement;

    // Vorher alle Klassen entfernen (z. B. "dark")
    html.classList.remove('dark');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct label based on dark mode state', () => {
    // default from localStorage: false
    expect(component.label()).toBe('Dark Mode');

    // toggle Signal manuell setzen
    (component as any).isDarkSignal.set(true);
    expect(component.label()).toBe('Light Mode');
  });

  it('should toggle dark mode and update signal, localStorage and html class', () => {
    expect(html.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('dark')).not.toBe('true');

    component.toggle();

    expect(html.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('dark')).toBe('true');
    expect((component as any).isDarkSignal()).toBeTrue();

    // erneut toggeln – zurück auf false
    component.toggle();
    expect(html.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('dark')).toBe('false');
    expect((component as any).isDarkSignal()).toBeFalse();
  });

  it('should initialize html class from localStorage on ngOnInit', () => {
    // Simuliere gespeicherten Zustand
    localStorage.setItem('dark', 'true');

    const testComponent = new DarkToggleComponent();
    testComponent.ngOnInit();

    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});
