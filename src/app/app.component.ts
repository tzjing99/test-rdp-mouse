import { Component } from '@angular/core';

// Minimum mousemove events required to qualify as a real human drag to button
const HUMAN_MOVE_THRESHOLD = 3;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  // Tracks whether mouseenter fired on the button before the click
  private _mouseOnBtn = false;
  // Counts mousemove events between mouseenter and click
  private _moveCnt = 0;

  // 'human' | 'epf' | null
  result: string | null = null;
  lastError: string | null = null;
  debugInfo: string | null = null;

  onBtnMouseEnter(): void {
    this._mouseOnBtn = true;
    this._moveCnt = 0; // reset counter every time mouse enters
  }

  onBtnMouseLeave(): void {
    this._mouseOnBtn = false;
    this._moveCnt = 0;
  }

  onBtnMouseMove(): void {
    this._moveCnt++;
  }

  onBtnClick(): void {
    this.lastError = null;
    const entered = this._mouseOnBtn;
    const moves = this._moveCnt;
    this.debugInfo = `mouseenter=${entered}, mousemove count=${moves}`;

    // Human: mouse entered the button AND generated several move events on the way
    // EPF image-based: teleports cursor → mouseenter fires BUT 0 move events
    // EPF element-based: no mouseenter at all
    const isHuman = entered && moves >= HUMAN_MOVE_THRESHOLD;

    if (isHuman) {
      this.result = 'human';
    } else {
      this.result = 'epf';
      // Reproduce the TypeError
      try {
        const ref: any = undefined;
        const width = ref.nativeElement.getBoundingClientRect().width;
        console.log(width);
      } catch (err: any) {
        this.lastError = err.message;
      }
    }

    // Reset for next click
    this._mouseOnBtn = false;
    this._moveCnt = 0;
  }
}
