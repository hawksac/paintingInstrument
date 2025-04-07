import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-piano-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piano-machine.component.html',
  styleUrls: ['./piano-machine.component.css']
})
export class PianoMachineComponent implements OnInit {
  pianoKeys: string[] = [];
  grid: { [key: string]: boolean[] } = {};
  audioElements: { [key: string]: HTMLAudioElement } = {};

  sequenceLength: number = 128;
  currentStep: number = 0;
  bpm: number = 120;

  isMouseDown: boolean = false;
  dragSetValue: boolean | null = null;

  constructor() {}

  ngOnInit(): void {
    this.generatePianoKeys();
    this.initializeGrid();
    this.loadSounds();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isMouseDown = false;
    this.dragSetValue = null;
  }

  generatePianoKeys() {
    this.pianoKeys = [
      'A-1', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
      'C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
      'D#0', 'D#1', 'D#2', 'D#3', 'D#4', 'D#5', 'D#6',
      'F#0', 'F#1', 'F#2', 'F#3', 'F#4', 'F#5', 'F#6'
    ];
    console.log("Available sample keys:", this.pianoKeys);
    this.pianoKeys.reverse();
  }

  initializeGrid() {
    this.pianoKeys.forEach(key => {
      this.grid[key] = new Array(this.sequenceLength).fill(false);
    });
  }

  loadSounds() {
    this.pianoKeys.forEach(key => {
      // Files are located at: assets/piano/sE8s Ped Down Med {key} RR1.wav
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
