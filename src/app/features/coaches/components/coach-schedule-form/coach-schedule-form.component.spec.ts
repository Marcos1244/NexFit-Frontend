import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoachScheduleFormComponent } from './coach-schedule-form.component';

describe('CoachScheduleFormComponent', () => {
  let component: CoachScheduleFormComponent;
  let fixture: ComponentFixture<CoachScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachScheduleFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachScheduleFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
