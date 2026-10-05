import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DyanmicDialogComponent } from './dyanmic-dialog.component';

describe('DyanmicDialogComponent', () => {
  let component: DyanmicDialogComponent;
  let fixture: ComponentFixture<DyanmicDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DyanmicDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DyanmicDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
