import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-drum-machine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drum-machine.component.html',
  styleUrls: ['./drum-machine.component.css']
})
export class DrumMachineComponent implements OnInit {
  drumSounds: { [key: string]: HTMLAudioElement } = {};

  pads = [
    { name: 'Kick', key: 'kick' },
    { name: 'Snare', key: 'snare' },
    { name: 'Hi-Hat', key: 'hihat' },
    { name: 'Clap', key: 'clap' }
  ];

  sequenceLength: number = 16;
  grid: { [key: string]: boolean[] } = {};
  currentStep: number = 0;
  bpm: number = 120;

  constructor() { }

  ngOnInit(): void {
    this.loadSounds();
    this.initializeGrid();
  }

  loadSounds() {
    this.drumSounds['kick'] = new Audio('assets/Kicks/2_4/UNISON_KICK_Krooker.wav');
    this.drumSounds['snare'] = new Audio('assets/Snares/2_4/UNISON_SNARE_Biggy.wav');
    this.drumSounds['hihat'] = new Audio('assets/Cymbals/Closed Hats/UNISON_CLSDHAT_666.wav');
    this.drumSounds['clap'] = new Audio('assets/Snaps/UNISON_SNAP_Ben.wav');
  }

  initializeGrid() {
    this.pads.forEach(pad => {
      this.grid[pad.key] = new Array(this.sequenceLength).fill(false);
    });
  }

  toggleStep(padKey: string, index: number) {
    this.grid[padKey][index] = !this.grid[padKey][index];
    if (this.grid[padKey][index]) {
      this.playSound(padKey);
    }
  }  

  playSound(soundKey: string) {
    const sound = this.drumSounds[soundKey];
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  playCurrentStep() {
    this.pads.forEach(pad => {
      if (this.grid[pad.key][this.currentStep]) {
        this.playSound(pad.key);
      }
    });
  }
}
