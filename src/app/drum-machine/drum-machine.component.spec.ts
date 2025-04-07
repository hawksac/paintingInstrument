import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrumMachineComponent } from './drum-machine.component';

describe('DrumMachineComponent', () => {
  let component: DrumMachineComponent;
  let fixture: ComponentFixture<DrumMachineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrumMachineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrumMachineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
