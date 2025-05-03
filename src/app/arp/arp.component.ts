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
  selector: 'app-arp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './arp.component.html',
  styleUrls: ['./arp.component.css']
})
export class ArpComponent implements OnInit, AfterViewInit {
  @ViewChild('arpCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  baseSamples = Array.from({ length: 10 }, (_, i) => ({
    name: `ARP ${i+1}`,
    key:  `arp-${i+1}`,
    path: `assets/arp/arp-${i+1}.mp3`
  }));
  samples = [...this.baseSamples];
  sequenceLength = 32;
  grid: { [key: string]: boolean[] } = {};
  currentStep = 0;
  arpSounds: { [key: string]: HTMLAudioElement } = {};

  // canvas metrics & drawing state
  canvasWidth = 0; canvasHeight = 0;
  rowHeight   = 0; stepWidth   = 0;
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
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), true);
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), true);
    document.addEventListener('mouseup',   this.onDocumentMouseUp.bind(this),   true);

    // Touch events
    document.addEventListener('touchstart', this.onDocumentTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove',  this.onDocumentTouchMove.bind(this),  { passive: false });
    document.addEventListener('touchend',   this.onDocumentTouchEnd.bind(this),   true);
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

  // ——————————————————————————————————————————————————————————————————
  // Helper to accept both MouseEvent & Touch "point"
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

  // ——————————————————————————————————————————————————————————————————
  // MOUSE
  private onDocumentMouseDown(ev: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(ev, rect)) return;
    this.startDraw(ev.clientX, ev.clientY, rect);
  }

  private onDocumentMouseMove(ev: MouseEvent) {
    if (!this.drawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawStepAndStroke(ev.clientX, ev.clientY, rect);
  }

  private onDocumentMouseUp(_: MouseEvent) {
    this.endDraw();
  }

  // ——————————————————————————————————————————————————————————————————
  // TOUCH
  private onDocumentTouchStart(ev: TouchEvent) {
    ev.preventDefault();
    const touch = ev.touches[0];
    const rect  = this.canvasRef.nativeElement.getBoundingClientRect();
    if (!this.isEventOverCanvas(touch, rect)) return;
    this.startDraw(touch.clientX, touch.clientY, rect);
  }

  private onDocumentTouchMove(ev: TouchEvent) {
    ev.preventDefault();
    if (!this.drawing) return;
    const touch = ev.touches[0];
    const rect  = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawStepAndStroke(touch.clientX, touch.clientY, rect);
  }

  private onDocumentTouchEnd(ev: TouchEvent) {
    ev.preventDefault();
    this.endDraw();
  }

  // ——————————————————————————————————————————————————————————————————
  // Common draw helpers
  private startDraw(x: number, y: number, rect: DOMRect) {
    this.drawing = true;
    this.lastX = x - rect.left;
    this.lastY = y - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
  }

  private drawStepAndStroke(x: number, y: number, rect: DOMRect) {
    const currentX = x - rect.left;
    const currentY = y - rect.top;

    // toggle grid cell
    const row = Math.floor(currentY / this.rowHeight);
    const col = Math.floor(currentX / this.stepWidth);
    if (row >= 0 && row < this.samples.length
     && col >= 0 && col < this.sequenceLength)
    {
      const key = this.samples[row].key;
      if (!this.grid[key][col]) {
        this.grid[key][col] = true;
        this.playSound(key);
      }
    }

    // free‑hand stroke
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = '#f39c12';
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

  // ——————————————————————————————————————————————————————————————————
  loadSounds() {
    this.samples.forEach(s => {
      this.arpSounds[s.key] = new Audio(s.path);
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
    const snd = this.arpSounds[key];
    if (snd) {
      snd.currentTime = 0;
      snd.play();
    }
  }

  playCurrentStep() {
    this.samples.forEach(s => {
      if (this.grid[s.key][this.currentStep]) {
        this.playSound(s.key);
      }
    });
  }
}
