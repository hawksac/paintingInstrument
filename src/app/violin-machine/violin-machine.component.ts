import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-violin-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './violin-machine.component.html',
  styleUrls: ['./violin-machine.component.css']
})
export class ViolinMachineComponent implements OnInit {
  violinKeys: string[] = [
    'G3', 'Ab3', 'A3', 'Bb3', 'B3',
    'C4', 'Db4', 'D4', 'Eb4', 'E4',
    'F4', 'Gb4', 'G4', 'Ab4', 'A4',
    'Bb4', 'B4', 'C5', 'Db5', 'D5',
    'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6'
  ];

  grid: { [key: string]: boolean[] } = {};
  audioElements: { [key: string]: HTMLAudioElement } = {};

  sequenceLength: number = 32;
  currentStep: number = 0;
  bpm: number = 120;

  isMouseDown: boolean = false;
  dragSetValue: boolean | null = null;

  constructor() {}

  ngOnInit(): void {
    this.initializeGrid();
    this.loadSounds();
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isMouseDown = false;
    this.dragSetValue = null;
  }

  initializeGrid() {
    this.violinKeys.forEach(key => {
      this.grid[key] = new Array(this.sequenceLength).fill(false);
    });
  }

  loadSounds() {
    // Files are expected at: assets/violin/Violin.arco.ff.sulG.{Note}.stereo.aiff
    this.violinKeys.forEach(key => {
      this.audioElements[key] = new Audio(`assets/violin/Violin.arco.ff.sulG.${key}.stereo.aiff`);
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
    this.violinKeys.forEach(key => {
      if (this.grid[key][this.currentStep]) {
        this.playSound(key);
      }
    });
  }
}
