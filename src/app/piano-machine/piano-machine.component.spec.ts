import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PianoMachineComponent } from './piano-machine.component';

describe('PianoMachineComponent', () => {
  let component: PianoMachineComponent;
  let fixture: ComponentFixture<PianoMachineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoMachineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PianoMachineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
