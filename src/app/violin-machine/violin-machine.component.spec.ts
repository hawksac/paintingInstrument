import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolinMachineComponent } from './violin-machine.component';

describe('ViolinMachineComponent', () => {
  let component: ViolinMachineComponent;
  let fixture: ComponentFixture<ViolinMachineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViolinMachineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViolinMachineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
