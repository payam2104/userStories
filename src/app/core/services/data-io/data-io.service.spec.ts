import { TestBed } from '@angular/core/testing';

import { DataIOService } from './data-io.service';
import { JourneyStore } from '../../stores/journey/journey.store';
import { IssueStore } from '../../stores/issue/issue.store';
import { ReleaseStore } from '../../stores/release/release.store';

describe('DataIoService', () => {
  let service: DataIOService;
  let journeyStoreSpy: jasmine.SpyObj<JourneyStore>;
  let issueStoreSpy: jasmine.SpyObj<IssueStore>;
  let releaseStoreSpy: jasmine.SpyObj<ReleaseStore>;

  beforeEach(() => {
    journeyStoreSpy = jasmine.createSpyObj('JourneyStore', ['replaceAll']);
    issueStoreSpy = jasmine.createSpyObj('IssueStore', ['replaceAll']);
    releaseStoreSpy = jasmine.createSpyObj('ReleaseStore', ['replaceAll']);

    TestBed.configureTestingModule({
      providers: [
        DataIOService,
        { provide: JourneyStore, useValue: journeyStoreSpy },
        { provide: IssueStore, useValue: issueStoreSpy },
        { provide: ReleaseStore, useValue: releaseStoreSpy }
      ]
    });

    service = TestBed.inject(DataIOService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sollte "data.json" als Standard-Dateiname verwenden', () => {
    const testData = { test: true };
    const fakeUrl = 'blob:http://default-test';

    spyOn(URL, 'createObjectURL').and.returnValue(fakeUrl);
    spyOn(URL, 'revokeObjectURL');

    const clickSpy = jasmine.createSpy('click');
    const mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    };

    spyOn(document, 'createElement').and.returnValue(mockAnchor as any);

    service.exportToFile(testData); // kein filename angegeben!

    expect(mockAnchor.download).toBe('data.json');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('sollte Daten importieren und replaceAll aufrufen', async () => {
    const mockData = {
      journeys: [{ id: 'j1', name: 'Journey 1', steps: [] }],
      issues: [{ id: 'i1', title: 'Issue 1', description: '...', stepId: 's1' }],
      releases: [{ id: 'r1', name: 'Release 1', date: '2025-01-01' }]
    };

    const file = new File(
      [JSON.stringify(mockData)],
      'test.json',
      { type: 'application/json' }
    );

    await service.importFromFile(file);

    expect(journeyStoreSpy.replaceAll).toHaveBeenCalledWith(mockData.journeys);
    expect(issueStoreSpy.replaceAll).toHaveBeenCalledWith(mockData.issues);
    expect(releaseStoreSpy.replaceAll).toHaveBeenCalledWith(mockData.releases);
  });

  it('sollte alert anzeigen, wenn journeys oder issues fehlen', async () => {
    spyOn(window, 'alert');

    const invalidData = { releases: [{ id: 'r1', name: 'Release 1' }] }; // kein journeys/issues
    const file = new File(
      [JSON.stringify(invalidData)],
      'invalid.json',
      { type: 'application/json' }
    );

    await service.importFromFile(file);

    expect(window.alert).toHaveBeenCalledWith(
      '❌ Ungültige JSON-Datei. Es fehlen "journeys" oder "issues".'
    );

    expect(journeyStoreSpy.replaceAll).not.toHaveBeenCalled();
    expect(issueStoreSpy.replaceAll).not.toHaveBeenCalled();
    expect(releaseStoreSpy.replaceAll).not.toHaveBeenCalled();
  });


});
