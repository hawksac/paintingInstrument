import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Observable }   from 'rxjs';
import { BpmService }   from '../../app/bpm.service';

interface Sample { name: string; key: string; path: string; }

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

  // your 8 existing samples + generated organ samples
  private readonly _base: Sample[] = [
    { name: 'Guitar UprightBass', key: 'sample1', path: 'assets/hawksrule1/DOM_guitar_one_shot_uprightbass_short_01_Cmaj.wav' },
    { name: 'Cassette Piano',       key: 'sample2', path: 'assets/hawksrule1/jc_ma_cassette_piano_one_shot_mulberryplus_Cmaj.wav' },
    { name: 'Bass Acoustic Round',   key: 'sample3', path: 'assets/hawksrule1/MB_JHE_bass_one_shot_acoustic_round_Cmaj.wav' },
    { name: 'Long Major',            key: 'sample4', path: 'assets/hawksrule1/pt_long_major1_C2.wav' },
    { name: 'Short Major7th',        key: 'sample5', path: 'assets/hawksrule1/pt_short_major7th_C.wav' },
    { name: 'Tom Classic',           key: 'sample6', path: 'assets/hawksrule1/TS_VD_tom_classic_maple_12_punch.wav' },
    { name: 'Tom Floor',             key: 'sample7', path: 'assets/hawksrule1/TS_VD_tom_floor_60s_slinger_punch.wav' },
    { name: 'Tom Rack',              key: 'sample8', path: 'assets/hawksrule1/TS_VD_tom_rack_60s_luddy.wav' }
  ];

  private readonly _organ: Sample[] = Array.from({ length: 10 }, (_, i) => ({
    name: `Organ ${i+1}`,
    key:  `organ-${i+1}`,
    path: `assets/organ/organ-${i+1}.mp3`
  }));

  samples: Sample[] = [...this._base, ...this._organ];
  sequenceLength = 32;
  grid: { [key: string]: boolean[] } = {};
  currentStep = 0;

  private hawksruleSounds: { [key: string]: HTMLAudioElement } = {};

  // canvas sizing
  canvasWidth = 0;
  canvasHeight = 0;
  rowHeight   = 0;
  stepWidth   = 0;

  // drawing state
  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  bpm$: Observable<number>;
  constructor(bpmService: BpmService) {
    this.bpm$ = bpmService.bpm$;
  }

  ngOnInit() {
    this.loadSounds();
    this.initializeGrid();
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    // Mouse events
    document.addEventListener('mousedown', this.onDocMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onDocMouseMove.bind(this), true);
    document.addEventListener('mouseup',   this.onDocMouseUp.bind(this),   true);

    // Touch events
    document.addEventListener('touchstart', this.onDocTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove',  this.onDocTouchMove.bind(this),  { passive: false });
    document.addEventListener('touchend',   this.onDocTouchEnd.bind(this),   true);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;

    this.canvasWidth  = canvas.width;
    this.canvasHeight = canvas.height;
    this.rowHeight    = this.canvasHeight / this.samples.length;
    this.stepWidth    = this.canvasWidth  / this.sequenceLength;
  }

  private isEventOverCanvas(
    evt: { clientX: number; clientY: number },
    rect: DOMRect
  ): boolean {
    return (
      evt.clientX >= rect.left &&
      evt.clientX <= rect.right &&
      evt.clientY >= rect.top &&
      evt.clientY <= rect.bottom
    );
  }

  // — Mouse
  private onDocMouseDown(ev: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(ev, rect)) return;
    this.startDraw(ev.clientX, ev.clientY, rect);
  }
  private onDocMouseMove(ev: MouseEvent) {
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawAndToggle(ev.clientX, ev.clientY, rect, '#3498db');
  }
  private onDocMouseUp(_: MouseEvent) {
    this.endDraw();
  }

  // — Touch
  private onDocTouchStart(ev: TouchEvent) {
    ev.preventDefault();
    const t    = ev.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(t, rect)) return;
    this.startDraw(t.clientX, t.clientY, rect);
  }
  private onDocTouchMove(ev: TouchEvent) {
    ev.preventDefault();
    if (!this.drawing) return;
    const t    = ev.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawAndToggle(t.clientX, t.clientY, rect, '#3498db');
  }
  private onDocTouchEnd(_: TouchEvent) {
    this.endDraw();
  }

  // — Helpers
  private startDraw(x: number, y: number, rect: DOMRect) {
    this.drawing = true;
    this.lastX   = x - rect.left;
    this.lastY   = y - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }
  private drawAndToggle(x: number, y: number, rect: DOMRect, color: string) {
    const cx = x - rect.left;
    const cy = y - rect.top;
    const row = Math.floor(cy / this.rowHeight);
    const col = Math.floor(cx / this.stepWidth);
    if (row >= 0 && row < this.samples.length && col >= 0 && col < this.sequenceLength) {
      const key = this.samples[row].key;
      if (!this.grid[key][col]) {
        this.grid[key][col] = true;
        this.playSound(key);
      }
    }
    this.ctx.lineTo(cx, cy);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = 5;
    this.ctx.stroke();
    this.lastX = cx;
    this.lastY = cy;
  }
  private endDraw() {
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }

  loadSounds() {
    this.samples.forEach(s => {
      this.hawksruleSounds[s.key] = new Audio(s.path);
    });
  }
  initializeGrid() {
    this.samples.forEach(s => {
      this.grid[s.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(key: string, i: number) {
    this.grid[key][i] = !this.grid[key][i];
    if (this.grid[key][i]) this.playSound(key);
  }
  playSound(key: string) {
    const snd = this.hawksruleSounds[key];
    if (snd) { snd.currentTime = 0; snd.play(); }
  }
  playCurrentStep() {
    this.samples.forEach(s => {
      if (this.grid[s.key][this.currentStep]) this.playSound(s.key);
    });
  }
}
