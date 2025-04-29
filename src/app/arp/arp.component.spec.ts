import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArpComponent } from './arp.component';

describe('ArpComponent', () => {
  let component: ArpComponent;
  let fixture: ComponentFixture<ArpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
