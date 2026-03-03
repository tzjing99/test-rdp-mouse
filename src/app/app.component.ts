import { Component } from '@angular/core';

// Minimum mousemove events required to qualify as a real human drag to button
const HUMAN_MOVE_THRESHOLD = 3;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  // true while the cursor is physically over the button
  private _mouseOnBtn = false;
  // true only for the FIRST entry after the mouse was outside (fresh hover)
  private _freshEntry = false;
  // mousemove events counted since the last mouseenter
  private _moveCnt = 0;

  result: string | null = null;
  lastError: string | null = null;
  debugInfo: string | null = null;

  onBtnMouseEnter(): void {
    this._mouseOnBtn = true;
    this._freshEntry = true;   // new hover pass → needs move verification
    this._moveCnt = 0;
  }

  onBtnMouseLeave(): void {
    this._mouseOnBtn = false;
    this._freshEntry = false;
    this._moveCnt = 0;
  }

  onBtnMouseMove(): void {
    this._moveCnt++;
  }

  onBtnClick(): void {
    this.lastError = null;
    const entered = this._mouseOnBtn;
    const fresh   = this._freshEntry;
    const moves   = this._moveCnt;
    this.debugInfo = `mouseenter=${entered}, fresh=${fresh}, mousemove count=${moves}`;

    // Human if:
    //   a) fresh hover AND enough move events (natural mouse drag onto button), OR
    //   b) already sitting on the button from a previous verified click (not fresh)
    // EPF image-based: fresh=true but moves=0 (cursor teleported, no drag)
    // EPF element-based: entered=false
    const isHuman = entered && (!fresh || moves >= HUMAN_MOVE_THRESHOLD);

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

    // After a verified human click the cursor stays on the button —
    // mark as NOT fresh so repeated clicks don't re-check move count.
    this._freshEntry = false;
    this._moveCnt = 0;
  }
}
