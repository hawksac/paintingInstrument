import { Component, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { DrumMachineComponent } from './drum-machine/drum-machine.component';
import { PianoMachineComponent } from './piano-machine/piano-machine.component';
import { ViolinMachineComponent } from './violin-machine/violin-machine.component';
import { HawksruleMachineComponent } from './hawksrule-machine/hawksrule-machine.component';
import { ArpComponent } from './arp/arp.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    DrumMachineComponent,
    PianoMachineComponent,
    ViolinMachineComponent,
    HawksruleMachineComponent,
    ArpComponent
  ]
})
export class AppComponent implements AfterViewInit {
  playing = false;
  selectedInstrument = 'drums';
  bpm = 120;
  intervalId: any = null;

  // References to child components
  @ViewChild(DrumMachineComponent, { static: true }) drumMachine!: DrumMachineComponent;
  @ViewChild(PianoMachineComponent, { static: true }) pianoMachine!: PianoMachineComponent;
  @ViewChild(ViolinMachineComponent, { static: true }) violinMachine!: ViolinMachineComponent;
  @ViewChild(HawksruleMachineComponent, { static: true }) hawksruleMachine!: HawksruleMachineComponent;
  @ViewChild(ArpComponent, { static: true }) arpComponent!: ArpComponent;

  // Single canvas in the parent
  @ViewChild('masterCanvas') masterCanvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  
  // Canvas sizing
  canvasWidth = 0;
  canvasHeight = 0;

  // For drawing
  drawing = false;
  lastX = 0;
  lastY = 0;

  ngAfterViewInit(): void {
    // Setup the master canvas
    const canvas = this.masterCanvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    // Listen for mouse events at the document level (or canvas level)
    document.addEventListener('mousedown', this.onMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    document.addEventListener('mouseup', this.onMouseUp.bind(this), true);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.masterCanvasRef.nativeElement;
    // figure out the actual CSS size:
    const rect = canvas.getBoundingClientRect();
  
    // make the internal canvas buffer match it:
    canvas.width  = rect.width;
    canvas.height = rect.height;
  
    // (optional) if you want to support high‑DPI screens:
    // const dpr = window.devicePixelRatio || 1;
    // canvas.width  = rect.width  * dpr;
    // canvas.height = rect.height * dpr;
    // this.ctx.scale(dpr, dpr);
  
    this.canvasWidth  = canvas.width;
    this.canvasHeight = canvas.height;
  }

  /* ~~~~ Mouse Drawing Logic ~~~~ */
  onMouseDown(event: MouseEvent) {
    // If user pressed inside the canvas
    const rect = this.masterCanvasRef.nativeElement.getBoundingClientRect();
    if (this.isEventOverCanvas(event, rect)) {
      this.drawing = true;
      this.lastX = event.clientX - rect.left;
      this.lastY = event.clientY - rect.top;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.drawing) return;
    const rect = this.masterCanvasRef.nativeElement.getBoundingClientRect();

    // If the mouse goes off-canvas, stop drawing
    if (!this.isEventOverCanvas(event, rect)) {
      return;
    }

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    // Toggle the instrument's grid cell
    this.paintCellOnSelectedInstrument(currentX, currentY);

    // Freehand drawing stroke
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = this.getColorForInstrument(this.selectedInstrument);
    this.ctx.lineWidth = 5;
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  onMouseUp(event: MouseEvent) {
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }

  private isEventOverCanvas(event: MouseEvent, rect: DOMRect): boolean {
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  /* ~~~~ Instrument-Specific Grid Toggling ~~~~ */
  paintCellOnSelectedInstrument(x: number, y: number) {
    // We must figure out how many rows, columns, etc. for the currently selected instrument
    if (this.selectedInstrument === 'drums') {
      const rowCount = this.drumMachine.samples.length;
      const colCount = this.drumMachine.sequenceLength;
    
      const rowHeight = this.canvasHeight / rowCount;
      const stepWidth = this.canvasWidth / colCount;
    
      const row = Math.floor(y / rowHeight);
      const col = Math.floor(x / stepWidth);
    
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        // Toggle the row in the drum machine
        const sample = this.drumMachine.samples[row];
        const key = sample.key;
        if (!this.drumMachine.grid[key][col]) {
          this.drumMachine.grid[key][col] = true;
          this.drumMachine.playSound(key);
        }
      }
    
    } else if (this.selectedInstrument === 'piano') {
      const samples  = this.pianoMachine.samples;
      const rowCount = samples.length;
      const colCount = this.pianoMachine.sequenceLength;
    
      const rowHeight = this.canvasHeight / rowCount;
      const stepWidth = this.canvasWidth  / colCount;
    
      const row = Math.floor(y / rowHeight);
      const col = Math.floor(x / stepWidth);
    
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        const keyName = samples[row].key;
        if (!this.pianoMachine.grid[keyName][col]) {
          this.pianoMachine.grid[keyName][col] = true;
          this.pianoMachine.playSound(keyName);
        }
      }   
    } else if (this.selectedInstrument === 'arp') {
      const rowCount = this.arpComponent.samples.length;
      const colCount = this.arpComponent.sequenceLength;
    
      const rowHeight = this.canvasHeight / rowCount;
      const stepWidth = this.canvasWidth / colCount;
    
      const row = Math.floor(y / rowHeight);
      const col = Math.floor(x / stepWidth);
    
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        // grab the Sample object…
        const sample = this.arpComponent.samples[row];
        // …then its key string
        const key = sample.key;
    
        if (!this.arpComponent.grid[key][col]) {
          this.arpComponent.grid[key][col] = true;
          this.arpComponent.playSound(key);
        }
      }
    } else if (this.selectedInstrument === 'violin') {
      const samples  = this.violinMachine.samples;
      const rowCount = samples.length;
      const colCount = this.violinMachine.sequenceLength;
    
      const rowHeight = this.canvasHeight / rowCount;
      const stepWidth = this.canvasWidth  / colCount;
    
      const row = Math.floor(y / rowHeight);
      const col = Math.floor(x / stepWidth);
    
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        const keyName = samples[row].key;
        if (!this.violinMachine.grid[keyName][col]) {
          this.violinMachine.grid[keyName][col] = true;
          this.violinMachine.playSound(keyName);
        }
      }
    } else if (this.selectedInstrument === 'hawksrule') {
      const samples  = this.hawksruleMachine.samples;
      const rowCount = samples.length;
      const colCount = this.hawksruleMachine.sequenceLength;
    
      const rowHeight = this.canvasHeight / rowCount;
      const stepWidth = this.canvasWidth  / colCount;
    
      const row = Math.floor(y / rowHeight);
      const col = Math.floor(x / stepWidth);
    
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        const keyName = samples[row].key;
        if (!this.hawksruleMachine.grid[keyName][col]) {
          this.hawksruleMachine.grid[keyName][col] = true;
          this.hawksruleMachine.playSound(keyName);
        }
      }
    }
  }

  /* ~~~~ Cosmetic: Color Based on Instrument ~~~~ */
  getColorForInstrument(instr: string): string {
    switch (instr) {
      case 'drums':     return 'red';
      case 'piano':     return 'blue';
      case 'violin':    return 'green';
      case 'hawksrule': return 'magenta';
      case 'arp':       return 'orange';
      default:          return 'black';
    }
  }

  /* ~~~~ Playback Logic ~~~~ */
  togglePlayback() {
    if (this.playing) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.playing = false;
    } else {
      // 60000 ms / BPM => milliseconds per beat
      // e.g. if BPM=120 => 500ms per beat. If we have 4 steps per beat => 125ms per step
      const interval = (60000 / this.bpm) / 4; 
      this.intervalId = setInterval(() => {
        // Advance each machine
        this.drumMachine.currentStep = (this.drumMachine.currentStep + 1) % this.drumMachine.sequenceLength;
        this.drumMachine.playCurrentStep();

        this.pianoMachine.currentStep = (this.pianoMachine.currentStep + 1) % this.pianoMachine.sequenceLength;
        this.pianoMachine.playCurrentStep();

        this.violinMachine.currentStep = (this.violinMachine.currentStep + 1) % this.violinMachine.sequenceLength;
        this.violinMachine.playCurrentStep();

        this.hawksruleMachine.currentStep = (this.hawksruleMachine.currentStep + 1) % this.hawksruleMachine.sequenceLength;
        this.hawksruleMachine.playCurrentStep();
      }, interval);
      this.playing = true;
    }
  }

  startPlayback() {
    if (!this.playing) {
      this.togglePlayback();   // kicks off the interval
    }
  }
  
  stopPlayback() {
    if (this.playing) {
      this.togglePlayback();   // clears it
    }
  }
}
