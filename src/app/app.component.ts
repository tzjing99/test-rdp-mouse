import { Component } from '@angular/core';

// Minimum mousemove events required to qualify as a real human drag to button
const HUMAN_MOVE_THRESHOLD = 3;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  // Counts mousemove events since the last click (or page load)
  private _moveCnt = 0;

  result: string | null = null;
  lastError: string | null = null;
  debugInfo: string | null = null;

  onBtnMouseEnter(): void {
    // entering fresh — reset so only moves AFTER entry count
    this._moveCnt = 0;
  }

  onBtnMouseLeave(): void {
    this._moveCnt = 0;
  }

  onBtnMouseMove(): void {
    this._moveCnt++;
  }

  onBtnClick(): void {
    this.lastError = null;
    const moves = this._moveCnt;
    this.debugInfo = `mousemove count=${moves}`;

    // Human: real cursor generates several move events before/between clicks
    // EPF (any mode): teleports or jumps directly — zero move events
    const isHuman = moves >= HUMAN_MOVE_THRESHOLD;

    if (isHuman) {
      this.result = 'human';
    } else {
      this.result = 'epf';
      try {
        const ref: any = undefined;
        const width = ref.nativeElement.getBoundingClientRect().width;
        console.log(width);
      } catch (err: any) {
        this.lastError = err.message;
      }
    }

    // Reset move count for the next click
    this._moveCnt = 0;
  }
}
