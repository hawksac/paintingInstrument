import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Sample {
  name: string;
  key: string;
  path: string;
}

@Component({
  selector: 'app-arp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './arp.component.html',
  styleUrls: ['./arp.component.css']
})
export class ArpComponent implements OnInit, AfterViewInit {
  @ViewChild('arpCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Define the ARP sample assets (1–40)
  baseSamples: Sample[] = Array.from({ length: 40 }, (_, i) => {
    const idx = i + 1;
    return {
      name: `ARP ${idx}`,
      key: `arp-${idx}`,
      path: `assets/arp/arp-${idx}.mp3`
    };
  });

  // Use all samples
  samples: Sample[] = [...this.baseSamples];

  sequenceLength: number = 64;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;
  bpm: number = 120;
  
  arpSounds: { [key: string]: HTMLAudioElement } = {};

  // For canvas coordinate mapping
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  rowHeight: number = 0;
  stepWidth: number = 0;

  // Mouse/painting flags for drawing
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  constructor() {}

  ngOnInit(): void {
    this.loadSounds();
    this.initializeGrid();
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
    // 1) Get the on‑screen size:
    const rect = canvas.getBoundingClientRect();
  
    // 2) Match the internal pixel buffer to that size:
    canvas.width  = rect.width;
    canvas.height = rect.height;
  
    // 3) Recompute your cell dimensions:
    this.canvasWidth  = canvas.width;
    this.canvasHeight = canvas.height;
    this.rowHeight    = this.canvasHeight / this.samples.length;
    this.stepWidth    = this.canvasWidth  / this.sequenceLength;
  }

  private isEventOverCanvas(event: MouseEvent, rect: DOMRect): boolean {
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  private onDocumentMouseDown(event: MouseEvent): void {
    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (this.isEventOverCanvas(event, canvasRect)) {
      this.drawing = true;
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
    if (!this.isEventOverCanvas(event, canvasRect)) {
      return;
    }

    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;

    // Determine which row and column are being drawn over
    const row = Math.floor(currentY / this.rowHeight);
    const col = Math.floor(currentX / this.stepWidth);

    if (row >= 0 && row < this.samples.length && col >= 0 && col < this.sequenceLength) {
      const sampleKey = this.samples[row].key;
      if (!this.grid[sampleKey][col]) {
        this.grid[sampleKey][col] = true;
        this.playSound(sampleKey);
      }
    }

    // Draw on the canvas
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();

    this.lastX = currentX;
    this.lastY = currentY;
  }

  private onDocumentMouseUp(event: MouseEvent): void {
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }

  loadSounds(): void {
    // Load each sample sound into hawksruleSounds using its file path
    this.samples.forEach(sample => {
      const audio = new Audio(sample.path);
      this.arpSounds[sample.key] = audio;
    });
  }

  initializeGrid(): void {
    // Create a 64-step grid for each sample (key)
    this.samples.forEach(sample => {
      this.grid[sample.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(sampleKey: string, index: number): void {
    this.grid[sampleKey][index] = !this.grid[sampleKey][index];
    if (this.grid[sampleKey][index]) {
      this.playSound(sampleKey);
    }
  }

  playSound(sampleKey: string): void {
    const sound = this.arpSounds[sampleKey];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  playCurrentStep(): void {
    // Plays sounds for steps marked active on the current step
    this.samples.forEach(sample => {
      if (this.grid[sample.key][this.currentStep]) {
        this.playSound(sample.key);
      }
    });
  }
}
