import { Component } from '@angular/core';

// Minimum mousemove events required to qualify as a real human drag to button
const HUMAN_MOVE_THRESHOLD = 3;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  // Set to true once enough mousemove events confirm a real human dragged here.
  // Stays true until the cursor leaves the button — repeated clicks stay green.
  private _verifiedHuman = false;
  private _moveCnt = 0;

  result: string | null = null;
  lastError: string | null = null;
  debugInfo: string | null = null;

  onBtnMouseEnter(): void {
    // Start counting fresh on every entry
    this._moveCnt = 0;
  }

  onBtnMouseLeave(): void {
    // Cursor left — must re-verify on next entry
    this._verifiedHuman = false;
    this._moveCnt = 0;
  }

  onBtnMouseMove(): void {
    this._moveCnt++;
    if (this._moveCnt >= HUMAN_MOVE_THRESHOLD) {
      this._verifiedHuman = true;  // promoted to verified — stays true until leave
    }
  }

  onBtnClick(): void {
    this.lastError = null;
    this.debugInfo = `verified=${this._verifiedHuman}, mousemove count=${this._moveCnt}`;

    // _verifiedHuman is true  → human moved cursor here naturally → PASS
    // _verifiedHuman is false → EPF teleported (0 move events) → FAIL
    if (this._verifiedHuman) {
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
    // Do NOT reset _verifiedHuman here — cursor is still on button, repeated clicks stay valid
    // Reset move counter only (informational)
    this._moveCnt = 0;
  }
}
