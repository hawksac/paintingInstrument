import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { BpmService } from '../../app/bpm.service'; // Added import for BpmService

interface Sample {
  name: string;
  key: string;
  path: string;
}

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

  // Container for loaded audio elements
  drumSounds: { [key: string]: HTMLAudioElement } = {};

  // Define the BEATS sample assets (1–40)
  baseSamples: Sample[] = Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    return {
      name: `Beat ${idx}`,
      key: `beats-${idx}`,
      path: `assets/beats/beats-${idx}.mp3`
    };
  });

  // Use all samples for sequencing
  samples: Sample[] = [...this.baseSamples];

  sequenceLength: number = 36;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;

  // Canvas mapping
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  rowHeight: number = 0;
  stepWidth: number = 0;

  // Drawing state
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  bpm$: Observable<number>;

  constructor(bpmService: BpmService) {
    this.bpm$ = bpmService.bpm$;
  }

  ngOnInit(): void {
    this.loadSounds();
    this.initializeGrid();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

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
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (this.isEventOverCanvas(event, rect)) {
      this.drawing = true;
      this.lastX = event.clientX - rect.left;
      this.lastY = event.clientY - rect.top;
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
    }
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(event, rect)) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const row = Math.floor(currentY / this.rowHeight);
    const col = Math.floor(currentX / this.stepWidth);

    if (row >= 0 && row < this.samples.length && col >= 0 && col < this.sequenceLength) {
      const sample = this.samples[row];
      const key = sample.key;
      if (!this.grid[key][col]) {
        this.grid[key][col] = true;
        this.playSound(key);
      }
    }

    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = '#e74c3c';
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
    this.samples.forEach(sample => {
      this.drumSounds[sample.key] = new Audio(sample.path);
    });
  }

  initializeGrid(): void {
    this.samples.forEach(sample => {
      this.grid[sample.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(key: string, index: number): void {
    this.grid[key][index] = !this.grid[key][index];
    if (this.grid[key][index]) {
      this.playSound(key);
    }
  }

  playSound(key: string): void {
    const sound = this.drumSounds[key];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  playCurrentStep(): void {
    this.samples.forEach(sample => {
      if (this.grid[sample.key][this.currentStep]) {
        this.playSound(sample.key);
      }
    });
  }
}