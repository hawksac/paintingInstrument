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
  selector: 'app-piano-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piano-machine.component.html',
  styleUrls: ['./piano-machine.component.css']
})
export class PianoMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('pianoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // exactly 40 piano samples, just like the drum machine
  baseSamples: Sample[] = Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    return {
      name: `Piano ${idx}`,
      key:  `piano-${idx}`,
      path: `assets/piano_v2/piano-${idx}.mp3`
    };
  });

  // use them directly for sequencing
  samples: Sample[] = [...this.baseSamples];

  sequenceLength: number = 36;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;

  // audio store
  pianoSounds: { [key: string]: HTMLAudioElement } = {};

  // canvas metrics
  canvasWidth  = 0;
  canvasHeight = 0;
  rowHeight    = 0;
  stepWidth    = 0;

  // drawing state
  private drawing = false;
  private lastX   = 0;
  private lastY   = 0;

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
    document.addEventListener('mouseup',   this.onDocumentMouseUp.bind(this),   true);
  }

  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;

    this.canvasWidth  = canvas.width;
    this.canvasHeight = canvas.height;
    this.rowHeight    = this.canvasHeight / this.samples.length;
    this.stepWidth    = this.canvasWidth  / this.sequenceLength;
  }

  private isEventOverCanvas(e: MouseEvent, r: DOMRect): boolean {
    return e.clientX >= r.left && e.clientX <= r.right &&
           e.clientY >= r.top  && e.clientY <= r.bottom;
  }

  private onDocumentMouseDown(e: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(e, rect)) return;
    this.drawing = true;
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  private onDocumentMouseMove(e: MouseEvent): void {
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(e, rect)) return;

    const x   = e.clientX - rect.left;
    const y   = e.clientY - rect.top;
    const row = Math.floor(y / this.rowHeight);
    const col = Math.floor(x / this.stepWidth);
    const sample = this.samples[row];

    if (sample && !this.grid[sample.key][col]) {
      this.grid[sample.key][col] = true;
      this.playSound(sample.key);
    }

    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = '#8e44ad';
    this.ctx.lineWidth   = 5;
    this.ctx.stroke();
    this.lastX = x;
    this.lastY = y;
  }

  private onDocumentMouseUp(_: MouseEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    this.ctx.closePath();
  }

  loadSounds(): void {
    this.samples.forEach(s => {
      this.pianoSounds[s.key] = new Audio(s.path);
    });
  }

  initializeGrid(): void {
    this.samples.forEach(s => {
      this.grid[s.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(key: string, i: number): void {
    this.grid[key][i] = !this.grid[key][i];
    if (this.grid[key][i]) {
      this.playSound(key);
    }
  }

  playSound(key: string): void {
    const snd = this.pianoSounds[key];
    if (!snd) return;
    snd.currentTime = 0;
    snd.play();
  }

  playCurrentStep(): void {
    this.samples.forEach(s => {
      if (this.grid[s.key][this.currentStep]) {
        this.playSound(s.key);
      }
    });
  }
}
