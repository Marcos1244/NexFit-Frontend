import { TestBed } from '@angular/core/testing';
import { CoachApiService } from './coach-api.service';

describe('CoachApiService', () => {
  let service: CoachApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoachApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
