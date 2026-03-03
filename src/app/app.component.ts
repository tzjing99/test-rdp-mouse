import { Component, ViewChild, ElementRef } from '@angular/core';

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

  // Option A fix demo
  @ViewChild('fixBtn') fixBtnRef?: ElementRef;
  isFixRowHovered = false;
  fixResult: 'pass' | 'fail' | null = null;
  fixError: string | null = null;
  fixWidth: number | null = null;

  onFixRowEnter(): void { this.isFixRowHovered = true; }
  onFixRowLeave(): void { this.isFixRowHovered = false; }

  // Option B defensive coding demo
  @ViewChild('obBtn') obBtnRef?: ElementRef;
  isObRowHovered = false;
  obResult: 'pass' | 'guarded' | null = null;
  obWidth: number | null = null;

  onObRowEnter(): void { this.isObRowHovered = true; }
  onObRowLeave(): void { this.isObRowHovered = false; }

  onObBtnClick(): void {
    this.obResult = null;
    this.obWidth = null;
    // Guarded read — no crash even if ref is undefined
    if (this.obBtnRef) {
      this.obWidth = Math.round(this.obBtnRef.nativeElement.getBoundingClientRect().width);
      this.obResult = 'pass';
    } else {
      this.obResult = 'guarded'; // silently skipped — no TypeError
    }
  }

  onObSimulateEpf(): void {
    // Simulate EPF: call handler directly without hover — obBtnRef will be undefined
    this.obResult = null;
    this.obWidth = null;
    if (this.obBtnRef) {
      this.obWidth = Math.round(this.obBtnRef.nativeElement.getBoundingClientRect().width);
      this.obResult = 'pass';
    } else {
      this.obResult = 'guarded';
    }
  }

  onFixBtnClick(): void {
    this.fixResult = null;
    this.fixError = null;
    this.fixWidth = null;
    try {
      // @ViewChild ALWAYS resolves because button is always in DOM
      const width = this.fixBtnRef!.nativeElement.getBoundingClientRect().width;
      this.fixWidth = Math.round(width);
      this.fixResult = 'pass';
    } catch (err: any) {
      this.fixError = err.message;
      this.fixResult = 'fail';
    }
  }

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
