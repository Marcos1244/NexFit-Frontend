import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuleLayoutComponent } from './module-layout.component';

describe('ModuleLayoutComponent', () => {
  let component: ModuleLayoutComponent;
  let fixture: ComponentFixture<ModuleLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
