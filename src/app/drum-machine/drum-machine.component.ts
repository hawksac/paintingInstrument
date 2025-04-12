import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-drum-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drum-machine.component.html',
  styleUrls: ['./drum-machine.component.css']
})
export class DrumMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('drumCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  drumSounds: { [key: string]: HTMLAudioElement } = {};

  pads = [
    { name: 'Kick', key: 'kick' },
    { name: 'Snare', key: 'snare' },
    { name: 'Hi-Hat', key: 'hihat' },
    { name: 'Clap', key: 'clap' }
  ];

  sequenceLength: number = 16;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;
  bpm: number = 120;

  // For mapping canvas coordinates
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  rowHeight: number = 0;
  stepWidth: number = 0;

  // Mouse/painting flags
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor() { }

  ngOnInit(): void {
    this.loadSounds();
    this.initializeGrid();
  }

  ngAfterViewInit(): void {
    // Canvas setup
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    // Attach document-level listeners for drawing
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), true);
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), true);
  }

  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    // Calculate rowHeight based on how many pad rows we have
    this.rowHeight = this.canvasHeight / this.pads.length;
    // Calculate stepWidth based on sequence length
    this.stepWidth = this.canvasWidth / this.sequenceLength;
  }

  /**
   * Document-level mouse handlers for freehand drawing & toggling steps
   */
  private onDocumentMouseDown(event: MouseEvent): void {
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (this.isEventOverCanvas(event, canvasRect)) {
      this.drawing = true;
      // Begin path for freehand drawing
      this.lastX = event.clientX - canvasRect.left;
      this.lastY = event.clientY - canvasRect.top;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
    }
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.drawing) {
      return;
    }

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    // If the mouse goes off-canvas, stop drawing
    if (!this.isEventOverCanvas(event, canvasRect)) {
      return;
    }

    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;

    // Figure out which row/col we are painting over
    const row = Math.floor(currentY / this.rowHeight);
    const col = Math.floor(currentX / this.stepWidth);

    // Guard against out of bounds if the user draws beyond edges
    if (row >= 0 && row < this.pads.length && col >= 0 && col < this.sequenceLength) {
      const padKey = this.pads[row].key;
      // If not already active, toggle it on & play
      if (!this.grid[padKey][col]) {
        this.grid[padKey][col] = true;
        this.playSound(padKey);
      }
    }

    // Continue freehand drawing on the canvas
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = 'rgba(255,0,0,1)';  // Example color
    this.ctx.lineWidth = 5;                   // Example line width
    this.ctx.stroke();

    // Update last known position
    this.lastX = currentX;
    this.lastY = currentY;
  }

  private onDocumentMouseUp(event: MouseEvent): void {
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

  /**
   * Existing drum machine logic
   */
  loadSounds(): void {
    this.drumSounds['kick']  = new Audio('assets/Kicks/2_4/UNISON_KICK_Krooker.wav');
    this.drumSounds['snare'] = new Audio('assets/Snares/2_4/UNISON_SNARE_Biggy.wav');
    this.drumSounds['hihat'] = new Audio('assets/Cymbals/Closed Hats/UNISON_CLSDHAT_666.wav');
    this.drumSounds['clap']  = new Audio('assets/Snaps/UNISON_SNAP_Ben.wav');
  }

  initializeGrid(): void {
    this.pads.forEach(pad => {
      this.grid[pad.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(padKey: string, index: number): void {
    this.grid[padKey][index] = !this.grid[padKey][index];
    if (this.grid[padKey][index]) {
      this.playSound(padKey);
    }
  }

  playSound(soundKey: string): void {
    const sound = this.drumSounds[soundKey];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  playCurrentStep(): void {
    this.pads.forEach(pad => {
      if (this.grid[pad.key][this.currentStep]) {
        this.playSound(pad.key);
      }
    });
  }
}
