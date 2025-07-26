import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { JourneyColumnComponent } from './journey-column.component';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { Journey } from '../../../core/model/journey.model';
import { Issue } from '../../../core/model/issue.model';
import { Step } from '../../../core/model/step.model';

describe('JourneyColumnComponent', () => {
  let component: JourneyColumnComponent;
  let fixture: ComponentFixture<JourneyColumnComponent>;

  const mockIssuesSignal = signal<Issue[]>([
    { id: 'i1', title: 'Issue 1', stepId: 's1', description: 'description 1' },
    { id: 'i2', title: 'Issue 2', stepId: 's2', description: 'description 2' },
    { id: 'i3', title: 'Issue 3', description: 'description 3' } // kein stepId
  ]);

  const issueStoreMock = {
    issues: mockIssuesSignal
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyColumnComponent],
      providers: [
        { provide: IssueStore, useValue: issueStoreMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JourneyColumnComponent);
    component = fixture.componentInstance;

    // Dummy-Journey für Inputs setzen
    component.journey = {
      id: 'j1',
      name: 'Test Journey',
      steps: [{ id: 's1', name: 'n1', user_journey_id: 'userJourneyId1' }, { id: 's2', name: 'n2', user_journey_id: 'userJourneyId2' }]
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngAfterViewInit: sollte "rendered" Event emitten', () => {
    const spy = spyOn(component.rendered, 'emit');
    component.ngAfterViewInit();
    expect(spy).toHaveBeenCalled(); // Erwartung: Event wurde ausgelöst
  });

  it('getIssuesForStep: liefert nur passende Issues für stepId', () => {
    const issuesSignal = component.getIssuesForStep('s1');
    const result = issuesSignal();
    expect(result.length).toBe(1); // Nur ein Issue mit stepId 's1'
    expect(result[0].id).toBe('i1'); // Erwartung: ID = i1
  });

  it('getIssuesForStep: liefert leeres Array für nicht vorhandene stepId', () => {
    const issuesSignal = component.getIssuesForStep('unbekannt');
    const result = issuesSignal();
    expect(result).toEqual([]);
  });

  it('getStepSignal: gibt das übergebene Step-Objekt als Signal zurück', () => {
    const step: Step = { id: 's1', name: 'n1', user_journey_id: 'userJourneyId1' };
    const stepSignal = component.getStepSignal(step);
    expect(stepSignal()).toEqual(step); // Erwartung: exakt dasselbe Objekt
  });
});
