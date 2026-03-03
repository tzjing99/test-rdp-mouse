import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  // Tracks whether mouseenter fired on the button before the click
  private _mouseOnBtn = false;

  // 'human' | 'epf' | null
  result: string | null = null;
  lastError: string | null = null;

  onBtnMouseEnter(): void {
    this._mouseOnBtn = true;
  }

  onBtnMouseLeave(): void {
    this._mouseOnBtn = false;
  }

  onBtnClick(): void {
    this.lastError = null;

    if (this._mouseOnBtn) {
      // mouseenter fired before click → human
      this.result = 'human';
    } else {
      // no mouseenter before click → EPF jump-click
      this.result = 'epf';
      // Reproduce the TypeError the same way the customer app crashes
      try {
        const ref: any = undefined; // viewBtnRef is undefined (never hovered)
        const width = ref.nativeElement.getBoundingClientRect().width;
        console.log(width);
      } catch (err: any) {
        this.lastError = err.message;
      }
    }

    // Reset for next click
    this._mouseOnBtn = false;
  }
}
