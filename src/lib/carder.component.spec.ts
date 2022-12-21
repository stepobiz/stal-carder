import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarderComponent } from './carder.component';

describe('CarderComponent', () => {
  let component: CarderComponent;
  let fixture: ComponentFixture<CarderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CarderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
