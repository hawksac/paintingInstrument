import { Component, OnInit, AfterViewInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-piano-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piano-machine.component.html',
  styleUrls: ['./piano-machine.component.css']
})
export class PianoMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('pianoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  pianoKeys: string[] = [];
  grid: { [key: string]: boolean[] } = {};
  audioElements: { [key: string]: HTMLAudioElement } = {};

  sequenceLength: number = 128;
  currentStep: number = 0;
  bpm: number = 120;

  isMouseDown: boolean = false;
  dragSetValue: boolean | null = null;
  isPainting: boolean = false; // for canvas painting mode

  // For mapping canvas coordinates
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  rowHeight: number = 0;
  stepWidth: number = 0;

  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {}

  ngOnInit(): void {
    this.generatePianoKeys();
    this.initializeGrid();
    this.loadSounds();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    // Attach document-level event listeners for drawing
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), true);
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), true);

  }
  

  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    // Calculate the height for each piano key row
    this.rowHeight = this.canvasHeight / this.pianoKeys.length;
    // Calculate step width based on the sequence length
    this.stepWidth = this.canvasWidth / this.sequenceLength;
    // Clear any previous drawings
  }

  // clearCanvas(): void {
  //   this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  // }

  private isEventOverCanvas(event: MouseEvent, rect: DOMRect): boolean {
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }
  
  onDocumentMouseDown(event: MouseEvent): void {
    console.log('Document MOUSE DOWN fired');
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    console.log('Canvas rect', canvasRect);
    if (this.isEventOverCanvas(event, canvasRect)) {
      this.lastX = event.clientX - canvasRect.left;
      this.lastY = event.clientY - canvasRect.top;
      this.drawing = true;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
    }
  }
  
  onDocumentMouseMove(event: MouseEvent): void {
    console.log('Document MOUSE MOVE fired');
    if (!this.drawing) {
      return;
    }
    
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    console.log('Canvas rect', canvasRect);
    if (!this.isEventOverCanvas(event, canvasRect)) {
      return;
    }
    
    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;
    
    // Calculate which grid cell (row & col) the user is painting over:
    const col = Math.floor(currentX / this.stepWidth);
    const row = Math.floor(currentY / this.rowHeight);
    const key = this.pianoKeys[row];
    
    // Toggle or activate the note if it is not already active:
    if (!this.grid[key][col]) {
      this.grid[key][col] = true;
      this.playSound(key);
    }
    
    // Continue with the freehand drawing stroke on the canvas:
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 1)';  // Change color as needed
    this.ctx.lineWidth = 5;  // Change line width if desired
    this.ctx.stroke();
    
    // Update the last known position
    this.lastX = currentX;
    this.lastY = currentY;
  }
  
  onDocumentMouseUp(event: MouseEvent): void {
    console.log('Document MOUSE UP fired');
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }  

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isMouseDown = false;
    this.dragSetValue = null;
  }

  generatePianoKeys() {
    // Using your updated list; note the order here is reversed later.
    this.pianoKeys = [
      'A-1', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
      'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
      'D#0', 'D#1', 'D#2', 'D#3', 'D#4', 'D#5', 'D#6',
      'F#0', 'F#1', 'F#2', 'F#3', 'F#4', 'F#5', 'F#6'
    ];
    console.log("Available sample keys:", this.pianoKeys);
    // Reverse the order so that the highest key is at the top.
    this.pianoKeys.reverse();
  }

  initializeGrid() {
    this.pianoKeys.forEach(key => {
      this.grid[key] = new Array(this.sequenceLength).fill(false);
    });
  }

  loadSounds() {
    this.pianoKeys.forEach(key => {
      // Adjust path as needed. For example:
      this.audioElements[key] = new Audio(`assets/piano/sE8s Ped Down Med ${key} RR1.wav`);
    });
  }

  startDrag(key: string, index: number) {
    this.isMouseDown = true;
    this.dragSetValue = !this.grid[key][index];
    this.grid[key][index] = this.dragSetValue;
    if (this.dragSetValue) {
      this.playSound(key);
    }
  }

  dragToggle(key: string, index: number) {
    if (this.isMouseDown && this.dragSetValue !== null) {
      if (this.grid[key][index] !== this.dragSetValue) {
        this.grid[key][index] = this.dragSetValue;
        if (this.dragSetValue) {
          this.playSound(key);
        }
      }
    }
  }

  toggleStep(key: string, index: number) {
    if (!this.isMouseDown) {
      this.grid[key][index] = !this.grid[key][index];
      if (this.grid[key][index]) {
        this.playSound(key);
      }
    }
  }

  playSound(key: string) {
    const audio = this.audioElements[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  playCurrentStep() {
    this.pianoKeys.forEach(key => {
      if (this.grid[key][this.currentStep]) {
        this.playSound(key);
      }
    });
  }
}
