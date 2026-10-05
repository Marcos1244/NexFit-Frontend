import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleForm } from './schedule-form';

describe('ScheduleForm', () => {
  let component: ScheduleForm;
  let fixture: ComponentFixture<ScheduleForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
