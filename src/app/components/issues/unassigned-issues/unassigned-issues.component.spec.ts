import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnassignedIssuesComponent } from './unassigned-issues.component';
import { Issue } from '../../../core/model/issue.model';
import { signal } from '@angular/core';
import { IssueStore } from '../../../core/stores/issue/issue.store';
import { JourneyStore } from '../../../core/stores/journey/journey.store';
import { ReleaseStore } from '../../../core/stores/release/release.store';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

describe('UnassignedIssuesComponent', () => {
  let component: UnassignedIssuesComponent;
  let fixture: ComponentFixture<UnassignedIssuesComponent>;

  let fakeIssueStore: any;
  let fakeJourneyStore: any;
  let fakeReleaseStore: any;

  const mockIssues: Issue[] = [
    { id: 'i1', title: 'Zugeordnet', description: '', releaseId: 'r1', stepId: 's1' },
    { id: 'i2', title: 'Unassigned 1', description: '', releaseId: undefined, stepId: undefined },
    { id: 'i3', title: 'Unassigned 2', description: '', releaseId: null, stepId: null }
  ];

  beforeEach(async () => {
    fakeIssueStore = {
      issues: signal<Issue[]>(mockIssues),
      resetAll: jasmine.createSpy('resetAll')
    };

    fakeJourneyStore = {
      resetAll: jasmine.createSpy('resetAll')
    };

    fakeReleaseStore = {
      resetAll: jasmine.createSpy('resetAll')
    };

    TestBed.configureTestingModule({
      imports: [UnassignedIssuesComponent],
      providers: [
        { provide: IssueStore, useValue: fakeIssueStore },
        { provide: JourneyStore, useValue: fakeJourneyStore },
        { provide: ReleaseStore, useValue: fakeReleaseStore }
      ]
    });

    fixture = TestBed.createComponent(UnassignedIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sollte nur unassigned Issues zurückgeben', () => {
    const result = component.unassignedIssues();
    expect(result.length).toBe(2);
    expect(result.map(i => i.id)).toEqual(['i2', 'i3']);
  });

  it('sollte Drop-Event korrekt emittieren', () => {
    spyOn(component.dropped, 'emit');
    const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<Issue[]>;

    component.onDrop(event);

    expect(component.dropped.emit).toHaveBeenCalledWith(event);
  });

  /*it('sollte resetAll auf allen Stores aufrufen', async () => {
    await component.resetData();

    expect(fakeIssueStore.resetAll).toHaveBeenCalled();
    expect(fakeReleaseStore.resetAll).toHaveBeenCalled();
    expect(fakeJourneyStore.resetAll).toHaveBeenCalled();
  });*/


});
