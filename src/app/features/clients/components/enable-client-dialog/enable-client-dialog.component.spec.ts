import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnableClientDialogComponent } from './enable-client-dialog.component';

describe('EnableClientDialogComponent', () => {
  let component: EnableClientDialogComponent;
  let fixture: ComponentFixture<EnableClientDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnableClientDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EnableClientDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
