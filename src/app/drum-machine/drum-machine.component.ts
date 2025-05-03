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
  baseSamples: Sample[] = Array.from({ length: 20 }, (_, i) => ({
    name: `Beat ${i+1}`,
    key:  `beats-${i+1}`,
    path: `assets/beats/beats-${i+1}.mp3`
  }));
  samples = [...this.baseSamples];
  sequenceLength = 36;
  grid: { [key: string]: boolean[] } = {};
  currentStep = 0;

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

    document.addEventListener('mousedown', this.onDocMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onDocMouseMove.bind(this), true);
    document.addEventListener('mouseup',   this.onDocMouseUp.bind(this),   true);

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

  private onDocMouseDown(ev: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(ev, rect)) return;
    this.startDraw(ev.clientX, ev.clientY, rect);
  }

  private onDocMouseMove(ev: MouseEvent) {
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawAndToggle(ev.clientX, ev.clientY, rect, '#e74c3c');
  }

  private onDocMouseUp(_: MouseEvent) {
    this.endDraw();
  }

  private onDocTouchStart(ev: TouchEvent) {
    ev.preventDefault();
    const touch = ev.touches[0];
    const rect  = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(touch, rect)) return;
    this.startDraw(touch.clientX, touch.clientY, rect);
  }

  private onDocTouchMove(ev: TouchEvent) {
    ev.preventDefault();
    if (!this.drawing) return;
    const touch = ev.touches[0];
    const rect  = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawAndToggle(touch.clientX, touch.clientY, rect, '#e74c3c');
  }

  private onDocTouchEnd(_: TouchEvent) {
    this.endDraw();
  }

  private startDraw(x: number, y: number, rect: DOMRect) {
    this.drawing = true;
    this.lastX = x - rect.left;
    this.lastY = y - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  private drawAndToggle(
    x: number,
    y: number,
    rect: DOMRect,
    color: string
  ) {
    const currentX = x - rect.left;
    const currentY = y - rect.top;

    const row = Math.floor(currentY / this.rowHeight);
    const col = Math.floor(currentX / this.stepWidth);
    if (
      row >= 0 && row < this.samples.length &&
      col >= 0 && col < this.sequenceLength
    ) {
      const key = this.samples[row].key;
      if (!this.grid[key][col]) {
        this.grid[key][col] = true;
        this.playSound(key);
      }
    }

    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = 5;
    this.ctx.stroke();
    this.lastX = currentX;
    this.lastY = currentY;
  }

  private endDraw() {
    if (this.drawing) {
      this.drawing = false;
      this.ctx.closePath();
    }
  }

  loadSounds() {
    this.samples.forEach(s => {
      this.drumSounds[s.key] = new Audio(s.path);
    });
  }

  initializeGrid() {
    this.samples.forEach(s => {
      this.grid[s.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(key: string, idx: number) {
    this.grid[key][idx] = !this.grid[key][idx];
    if (this.grid[key][idx]) this.playSound(key);
  }

  playSound(key: string) {
    const s = this.drumSounds[key];
    if (s) { s.currentTime = 0; s.play(); }
  }

  playCurrentStep() {
    this.samples.forEach(s => {
      if (this.grid[s.key][this.currentStep]) this.playSound(s.key);
    });
  }
}
