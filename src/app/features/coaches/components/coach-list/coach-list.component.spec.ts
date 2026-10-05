import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoachListComponent } from './coach-list.component';

describe('CoachListComponent', () => {
  let component: CoachListComponent;
  let fixture: ComponentFixture<CoachListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoachListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CoachListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
