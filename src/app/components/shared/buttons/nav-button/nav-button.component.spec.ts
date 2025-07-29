/*import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavButtonComponent } from './nav-button.component';

describe('NavButtonComponent', () => {
  let component: NavButtonComponent;
  let fixture: ComponentFixture<NavButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavButtonComponent } from './nav-button.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavButtonComponent', () => {
  let component: NavButtonComponent;
  let fixture: ComponentFixture<NavButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NavButtonComponent);
    component = fixture.componentInstance;

    component.buttonLabel = 'Weiter';
    component.navRouterLink = '/next-page';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render link with correct label and routerLink', () => {
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(anchor.textContent?.trim()).toBe('Weiter');
    expect(anchor.getAttribute('ng-reflect-router-link')).toBe('/next-page');
  });
});
