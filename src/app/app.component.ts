import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { DrumMachineComponent } from './drum-machine/drum-machine.component';
import { PianoMachineComponent } from './piano-machine/piano-machine.component';
import { ViolinMachineComponent } from './violin-machine/violin-machine.component';
import { HawksruleMachineComponent } from './hawksrule-machine/hawksrule-machine.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [DrumMachineComponent, PianoMachineComponent, ViolinMachineComponent, HawksruleMachineComponent],
  standalone: true,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  playing = false;
  selectedInstrument = 'drums';
  bpm = 120;
  intervalId: any = null;

  // Use static: true so the children are available immediately.
  @ViewChild(DrumMachineComponent, { static: true }) drumMachine!: DrumMachineComponent;
  @ViewChild(PianoMachineComponent, { static: true }) pianoMachine!: PianoMachineComponent;
  @ViewChild(ViolinMachineComponent, { static: true }) violinMachine!: ViolinMachineComponent;
  @ViewChild(HawksruleMachineComponent, { static: true }) hawksruleMachine!: HawksruleMachineComponent;

  ngAfterViewInit() {
  }

  togglePlayback() {
    if (this.playing) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.playing = false;
    } else {
      const interval = (60000 / this.bpm) / 4; // 4 steps per beat (adjust as needed)
      this.intervalId = setInterval(() => {
        // For each instrument, update the current step and then play the step.
        this.drumMachine.currentStep = (this.drumMachine.currentStep + 1) % this.drumMachine.sequenceLength;
        this.pianoMachine.currentStep = (this.pianoMachine.currentStep + 1) % this.pianoMachine.sequenceLength;
        this.violinMachine.currentStep = (this.violinMachine.currentStep + 1) % this.violinMachine.sequenceLength;
        this.hawksruleMachine.currentStep = (this.hawksruleMachine.currentStep + 1) % this.hawksruleMachine.sequenceLength;
        
        this.drumMachine.playCurrentStep();
        this.pianoMachine.playCurrentStep();
        this.violinMachine.playCurrentStep();
        this.hawksruleMachine.playCurrentStep();
      }, interval);
      this.playing = true;
    }
  }
}
