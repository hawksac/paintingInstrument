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
  selector: 'app-violin-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './violin-machine.component.html',
  styleUrls: ['./violin-machine.component.css']
})
export class ViolinMachineComponent implements OnInit, AfterViewInit {
  @ViewChild('violinCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // EXACTLY 40 brass samples
  baseSamples: Sample[] = Array.from({ length: 10 }, (_, i) => ({
    name: `Brass ${i+1}`,
    key:  `brass-${i+1}`,
    path: `assets/brass/brass-${i+1}.mp3`
  }));
  samples = [...this.baseSamples];

  sequenceLength = 32;
  grid: { [key: string]: boolean[] } = {};
  currentStep = 0;

  private violinSounds: { [key: string]: HTMLAudioElement } = {};

  canvasWidth = 0;
  canvasHeight = 0;
  rowHeight   = 0;
  stepWidth   = 0;

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
    new ResizeObserver(() => this.resizeCanvas())
    .observe(canvas.parentElement!);

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
    this.drawAndToggle(ev.clientX, ev.clientY, rect, '#27ae60');
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
    this.drawAndToggle(t.clientX, t.clientY, rect, '#27ae60');
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
    if (row >= 0 && row < this.samples.length && col >=0 && col < this.sequenceLength) {
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
    this.samples.forEach(s => { this.violinSounds[s.key] = new Audio(s.path); });
  }
  initializeGrid() {
    this.samples.forEach(s => { this.grid[s.key] = new Array(this.sequenceLength).fill(false); });
  }

  toggleStep(key: string, i: number) {
    this.grid[key][i] = !this.grid[key][i];
    if (this.grid[key][i]) this.playSound(key);
  }
  playSound(key: string) {
    const snd = this.violinSounds[key]; if (snd) { snd.currentTime = 0; snd.play(); }
  }
  playCurrentStep() {
    this.samples.forEach(s => { if (this.grid[s.key][this.currentStep]) this.playSound(s.key); });
  }
}
