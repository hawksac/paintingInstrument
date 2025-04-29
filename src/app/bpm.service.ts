import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BpmService {
  // Holds the current BPM and emits updates
  private readonly _bpm$ = new BehaviorSubject<number>(120);
  
  /** Observable you can subscribe to */
  readonly bpm$ = this._bpm$.asObservable();

  /** Imperative getter */
  get bpm(): number {
    return this._bpm$.value;
  }

  /** Imperative setter (will emit to subscribers) */
  set bpm(newBpm: number) {
    this._bpm$.next(newBpm);
  }
}
