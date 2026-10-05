import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoachFormComponent } from './coach-form.component';

describe('CoachFormComponent', () => {
  let component: CoachFormComponent;
  let fixture: ComponentFixture<CoachFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
