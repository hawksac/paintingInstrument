import { Component, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { DrumMachineComponent } from './drum-machine/drum-machine.component';
import { PianoMachineComponent } from './piano-machine/piano-machine.component';
import { ViolinMachineComponent } from './violin-machine/violin-machine.component';
import { HawksruleMachineComponent } from './hawksrule-machine/hawksrule-machine.component';
import { ArpComponent } from './arp/arp.component';
import { BpmService }   from './bpm.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    ArpComponent,
    CommonModule,
    FormsModule
  ]
})
export class AppComponent implements AfterViewInit {
  playing = false;
  selectedInstrument = 'drums';
  intervalId: any = null;
  eraserMode = false;

  constructor(public bpmService: BpmService) {}

  /** expose service.bpm for ngModel */
  get bpm(): number {
    return this.bpmService.bpm;
  }
  set bpm(v: number) {
    this.bpmService.bpm = v;
  }

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
    new ResizeObserver(() => this.resizeCanvas())
    .observe(canvas.parentElement!);

    // Listen for mouse events at the document level (or canvas level)
    document.addEventListener('mousedown', this.onMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onMouseMove.bind(this), true);
    document.addEventListener('mouseup', this.onMouseUp.bind(this), true);

    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove',  this.onTouchMove.bind(this),  { passive: false });
    document.addEventListener('touchend',   this.onTouchEnd.bind(this),   true);
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

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();  // prevent scrolling
    const touch = e.touches[0];
    const rect  = this.masterCanvasRef.nativeElement.getBoundingClientRect();
    this.drawing = true;
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault();  // prevent scrolling
    if (!this.drawing) return;
    const touch = e.touches[0];
    const rect  = this.masterCanvasRef.nativeElement.getBoundingClientRect();

    // If the touch goes off-canvas, stop drawing
    if (!this.isEventOverCanvas(touch, rect)) {
      return;
    }

    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

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

  private isEventOverCanvas(
    event: { clientX: number; clientY: number },
    rect: DOMRect
  ): boolean {
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }
  
  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();            // stop any native scrolling
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }

  /** Toggle eraser vs. draw mode */
  toggleEraser() {
    this.eraserMode = !this.eraserMode;
  }

  /** Completely clear canvas and all the sequencer grids */
  clearAll() {
    // 1) clear the drawing canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // 2) reset every grid cell in each machine
    this.clearGrid(this.drumMachine.grid);
    this.clearGrid(this.pianoMachine.grid);
    this.clearGrid(this.violinMachine.grid);
    this.clearGrid(this.hawksruleMachine.grid);
    this.clearGrid(this.arpComponent.grid);
  }

  /** helper to zero out a key→boolean[] map */
  private clearGrid(grid: { [key: string]: boolean[] }) {
    Object.values(grid).forEach(arr => arr.fill(false));
  }

  /* ~~~~ Instrument-Specific Grid Toggling ~~~~ */
  paintCellOnSelectedInstrument(x: number, y: number) {
    // 1) Choose the right machine’s data & play function
    let samples: { key: string }[];
    let gridMap: { [key: string]: boolean[] };
    let seqLen: number;
    let playFn: (key: string) => void;
  
    switch (this.selectedInstrument) {
      case 'drums':
        samples = this.drumMachine.samples;
        seqLen  = this.drumMachine.sequenceLength;
        gridMap = this.drumMachine.grid;
        playFn  = this.drumMachine.playSound.bind(this.drumMachine);
        break;
      case 'piano':
        samples = this.pianoMachine.samples;
        seqLen  = this.pianoMachine.sequenceLength;
        gridMap = this.pianoMachine.grid;
        playFn  = this.pianoMachine.playSound.bind(this.pianoMachine);
        break;
      case 'violin':
        samples = this.violinMachine.samples;
        seqLen  = this.violinMachine.sequenceLength;
        gridMap = this.violinMachine.grid;
        playFn  = this.violinMachine.playSound.bind(this.violinMachine);
        break;
      case 'hawksrule':
        samples = this.hawksruleMachine.samples;
        seqLen  = this.hawksruleMachine.sequenceLength;
        gridMap = this.hawksruleMachine.grid;
        playFn  = this.hawksruleMachine.playSound.bind(this.hawksruleMachine);
        break;
      case 'arp':
        samples = this.arpComponent.samples;
        seqLen  = this.arpComponent.sequenceLength;
        gridMap = this.arpComponent.grid;
        playFn  = this.arpComponent.playSound.bind(this.arpComponent);
        break;
      default:
        return; // unknown instrument
    }
  
    // 2) Figure out which cell was clicked
    const rowCount = samples.length;
    const colCount = seqLen;
    const rowHeight = this.canvasHeight / rowCount;
    const stepWidth = this.canvasWidth  / colCount;
  
    const row = Math.floor(y / rowHeight);
    const col = Math.floor(x / stepWidth);
  
    // out‐of‐bounds guard
    if (row < 0 || row >= rowCount || col < 0 || col >= colCount) return;
  
    // 3) Erase or draw
    const key = samples[row].key;
    if (this.eraserMode) {
      // erase mode ➔ always turn off
      gridMap[key][col] = false;
    } else {
      // draw mode ➔ only turn on and play if it was off
      if (!gridMap[key][col]) {
        gridMap[key][col] = true;
        playFn(key);
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
