import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Sample {
  name: string;
  key: string;
  path: string;
}

@Component({
  selector: 'app-hawksrule-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hawksrule-machine.component.html',
  styleUrls: ['./hawksrule-machine.component.css']
})
export class HawksruleMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('hawksruleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Define the sample assets (first eight)
  baseSamples: Sample[] = [
    { name: 'Guitar UprightBass', key: 'sample1', path: 'assets/hawksrule1/DOM_guitar_one_shot_uprightbass_short_01_Cmaj.wav' },
    { name: 'Cassette Piano', key: 'sample2', path: 'assets/hawksrule1/jc_ma_cassette_piano_one_shot_mulberryplus_Cmaj.wav' },
    { name: 'Bass Acoustic Round', key: 'sample3', path: 'assets/hawksrule1/MB_JHE_bass_one_shot_acoustic_round_Cmaj.wav' },
    { name: 'Long Major', key: 'sample4', path: 'assets/hawksrule1/pt_long_major1_C2.wav' },
    { name: 'Short Major7th', key: 'sample5', path: 'assets/hawksrule1/pt_short_major7th_C.wav' },
    { name: 'Tom Classic', key: 'sample6', path: 'assets/hawksrule1/TS_VD_tom_classic_maple_12_punch.wav' },
    { name: 'Tom Floor', key: 'sample7', path: 'assets/hawksrule1/TS_VD_tom_floor_60s_slinger_punch.wav' },
    { name: 'Tom Rack', key: 'sample8', path: 'assets/hawksrule1/TS_VD_tom_rack_60s_luddy.wav' },
  ];

  // Repeat the samples once to have 16 rows
  samples: Sample[] = [ ...this.baseSamples, ...this.baseSamples.map(s => ({ ...s, key: s.key + '_r' })) ];

  sequenceLength: number = 64;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;
  bpm: number = 120;
  
  hawksruleSounds: { [key: string]: HTMLAudioElement } = {};

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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.rowHeight = this.canvasHeight / this.samples.length;
    this.stepWidth = this.canvasWidth / this.sequenceLength;
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
      this.hawksruleSounds[sample.key] = audio;
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
    const sound = this.hawksruleSounds[sampleKey];
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
