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
  selector: 'app-hawksrule-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hawksrule-machine.component.html',
  styleUrls: ['./hawksrule-machine.component.css']
})
export class HawksruleMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('hawksruleCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // your 8 existing samples:
  private readonly _base = [
    { name: 'Guitar UprightBass', key: 'sample1', path: 'assets/hawksrule1/DOM_guitar_one_shot_uprightbass_short_01_Cmaj.wav' },
    { name: 'Cassette Piano',       key: 'sample2', path: 'assets/hawksrule1/jc_ma_cassette_piano_one_shot_mulberryplus_Cmaj.wav' },
    { name: 'Bass Acoustic Round',   key: 'sample3', path: 'assets/hawksrule1/MB_JHE_bass_one_shot_acoustic_round_Cmaj.wav' },
    { name: 'Long Major',            key: 'sample4', path: 'assets/hawksrule1/pt_long_major1_C2.wav' },
    { name: 'Short Major7th',        key: 'sample5', path: 'assets/hawksrule1/pt_short_major7th_C.wav' },
    { name: 'Tom Classic',           key: 'sample6', path: 'assets/hawksrule1/TS_VD_tom_classic_maple_12_punch.wav' },
    { name: 'Tom Floor',             key: 'sample7', path: 'assets/hawksrule1/TS_VD_tom_floor_60s_slinger_punch.wav' },
    { name: 'Tom Rack',              key: 'sample8', path: 'assets/hawksrule1/TS_VD_tom_rack_60s_luddy.wav' },
  ];

  // generate 32 organ samples:
  private readonly _organ = Array.from({ length: 20 }, (_, i) => {
    const idx = i + 1;
    return {
      name: `Organ ${idx}`,
      key:  `organ-${idx}`,
      path: `assets/organ/organ-${idx}.mp3`
    } as Sample;
  });

  // combine into exactly 40 rows:
  samples: Sample[] = [...this._base, ...this._organ];

  sequenceLength = 36;
  grid: { [key: string]: boolean[] } = {};
  currentStep = 0;

  private hawksruleSounds: { [key: string]: HTMLAudioElement } = {};

  // canvas sizing
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
    const s   = this.samples[row];

    if (s && !this.grid[s.key][col]) {
      this.grid[s.key][col] = true;
      this.playSound(s.key);
    }

    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = '#3498db';
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
      this.hawksruleSounds[s.key] = new Audio(s.path);
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
    const snd = this.hawksruleSounds[key];
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
