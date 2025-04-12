import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HawksruleMachineComponent } from './hawksrule-machine.component';

describe('HawksruleMachineComponent', () => {
  let component: HawksruleMachineComponent;
  let fixture: ComponentFixture<HawksruleMachineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HawksruleMachineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HawksruleMachineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
