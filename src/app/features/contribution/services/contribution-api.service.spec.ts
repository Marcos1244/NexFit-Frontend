import { TestBed } from '@angular/core/testing';
import { ContributionApiService } from './contribution-api.service';

describe('ContributionApiService', () => {
  let service: ContributionApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContributionApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
