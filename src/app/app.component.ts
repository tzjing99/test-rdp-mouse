import {
  Component, OnInit, OnDestroy, NgZone,
  ViewChild, ElementRef, ChangeDetectorRef
} from '@angular/core';

// ── Types ────────────────────────────────────────────────────────────────────
export type EventLevel = 'info' | 'success' | 'warn' | 'error';

export interface MouseMarker {
  id: number;
  x: number;
  y: number;
  pointerType: string;
  button: number;
  eventType: string;
}

export interface EventEntry {
  id: number;
  time: string;
  type: string;
  message: string;
  level: EventLevel;
}

export interface Order {
  id: string; customer: string; product: string;
  qty: number; amount: number; status: string;
  details: string; isSpecialRow: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  // ── Mouse-test canvas ──────────────────────────────────────────────────────
  markers: MouseMarker[] = [];
  private markerId = 0;
  private markerTimers: ReturnType<typeof setTimeout>[] = [];

  // ── Live stats ─────────────────────────────────────────────────────────────
  stats = {
    pointerdown: 0, mousedown: 0, mouseup: 0,
    click: 0, dblclick: 0, contextmenu: 0
  };
  currentPointerType = '—';
  lastPos = { x: 0, y: 0 };

  // ── Event log ──────────────────────────────────────────────────────────────
  eventLog: EventEntry[] = [];
  private logId = 0;

  // ── Modal: ViewChild references ────────────────────────────────────────────
  // #modalBody is inside *ngIf="isModalOpen" — undefined while modal is closed.
  @ViewChild('modalBody') modalBodyRef?: ElementRef;

  // KEY REPRODUCTION:
  // #viewBtn is inside *ngIf="isRowHovered" — it only enters the DOM after mouseenter.
  // Native mouse always hovers before click → ref exists.
  // EPF jump-clicks without hover → ref is UNDEFINED → crash.
  @ViewChild('viewBtn') viewBtnRef?: ElementRef;

  isModalOpen = false;
  isRowHovered = false;       // tracks whether the special row is currently hovered
  selectedOrder: Order | null = null;

  // ── Bug-reproduction toggle ────────────────────────────────────────────────
  // bugMode ON  = faithful customer reproduction (hover-gated ViewChild crash)
  // bugMode OFF = correct pattern: read ref inside setTimeout(0) after *ngIf renders
  bugMode = true;
  lastError: string | null = null;

  // ── Orders table ───────────────────────────────────────────────────────────
  orders: Order[] = [
    { id:'ORD-001', customer:'Alice Johnson',  product:'Widget A', qty:2, amount:150.00, status:'Shipped',    details:'Shipped via FedEx. Tracking: FX123456.',                      isSpecialRow:false },
    { id:'ORD-002', customer:'Bob Smith',      product:'Widget B', qty:5, amount:220.50, status:'Processing', details:'Payment verified. Preparing shipment.',                        isSpecialRow:false },
    { id:'ORD-003', customer:'Charlie Brown',  product:'Widget C', qty:1, amount:75.25,  status:'Pending',    details:'Awaiting supplier confirmation. ETA 3 business days.',        isSpecialRow:true  },
    { id:'ORD-004', customer:'Diana Prince',   product:'Widget D', qty:3, amount:410.00, status:'Delivered',  details:'Delivered on 2026-02-28. Signed by D. Prince.',               isSpecialRow:false },
    { id:'ORD-005', customer:'Eve Wilson',     product:'Widget E', qty:7, amount:90.00,  status:'Cancelled',  details:'Cancelled by customer request on 2026-02-20.',                isSpecialRow:false }
  ];

  // ── Global listener cleanup refs ───────────────────────────────────────────
  private _handlers: Array<[string, EventListener]> = [];

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    console.log('Diagnostic started. Click anywhere...');

    this._on('pointerdown', (e: Event) => {
      const pe = e as PointerEvent;
      this.currentPointerType = pe.pointerType || 'mouse';
      this.stats.pointerdown++;
      this.addMarker(pe);
      this.addLog('pointerdown',
        `pointerType=${pe.pointerType} | button=${pe.button} | (${Math.round(pe.clientX)}, ${Math.round(pe.clientY)})`,
        'info');
    });

    this._on('mousedown', (e: Event) => {
      const me = e as MouseEvent;
      this.stats.mousedown++;
      this.addLog('mousedown',
        `button=${me.button} | (${Math.round(me.clientX)}, ${Math.round(me.clientY)})`, 'info');
    });

    this._on('mouseup', (e: Event) => {
      const me = e as MouseEvent;
      this.stats.mouseup++;
      this.addLog('mouseup',
        `button=${me.button} | (${Math.round(me.clientX)}, ${Math.round(me.clientY)})`, 'info');
    });

    this._on('click', (e: Event) => {
      const me = e as MouseEvent;
      this.stats.click++;
      this.lastPos = { x: Math.round(me.clientX), y: Math.round(me.clientY) };
      this.addLog('click',
        `✅ Full click | button=${me.button} | (${Math.round(me.clientX)}, ${Math.round(me.clientY)})`,
        'success');
    });

    this._on('dblclick', (e: Event) => {
      const me = e as MouseEvent;
      this.stats.dblclick++;
      this.addLog('dblclick',
        `⚡ DblClick | (${Math.round(me.clientX)}, ${Math.round(me.clientY)})`, 'warn');
    });

    this._on('contextmenu', (e: Event) => {
      const me = e as MouseEvent;
      this.stats.contextmenu++;
      this.addLog('contextmenu',
        `Right-click | (${Math.round(me.clientX)}, ${Math.round(me.clientY)})`, 'warn');
    });

    this._on('mousemove', (e: Event) => {
      const me = e as MouseEvent;
      this.zone.run(() => {
        this.lastPos = { x: Math.round(me.clientX), y: Math.round(me.clientY) };
      });
    });
  }

  ngOnDestroy(): void {
    this._handlers.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
    this.markerTimers.forEach(t => clearTimeout(t));
  }

  // ── Hover tracking on the special row ────────────────────────────────────
  onRowMouseEnter(order: Order): void {
    this.isRowHovered = true;
    this.addLog('mouseenter', `Hovered over ${order.id} — #viewBtn NOW in DOM`, 'info');
  }

  onRowMouseLeave(): void {
    this.isRowHovered = false;
    this.addLog('mouseleave', 'Left row — #viewBtn REMOVED from DOM', 'info');
  }

  // ── Simulate EPF jump-click (no hover, button never in DOM) ───────────────
  simulateEpfClick(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    // Force hover state OFF — viewBtnRef will be undefined (button not in DOM)
    this.isRowHovered = false;
    this.cdr.detectChanges();
    this.addLog('EPF-simulate', `⚡ Simulating EPF jump-click on ${order.id} — isRowHovered forced to false`, 'warn');
    this.openModal(order, event);
  }

  // ── Modal: reproduces / fixes the ViewChild crash ─────────────────────────
  openModal(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.lastError = null;

    const hoverState = this.isRowHovered ? 'YES (hovered)' : 'NO (no prior hover — EPF path)';
    this.addLog('row-hover-state',
      `isRowHovered = ${this.isRowHovered} | viewBtnRef = ${this.viewBtnRef ? 'EXISTS' : 'UNDEFINED'}`,
      this.isRowHovered ? 'info' : 'warn');

    if (this.bugMode) {
      // ⚠ FAITHFUL CUSTOMER REPRODUCTION:
      // #viewBtn is guarded by *ngIf="isRowHovered".
      // - Native mouse: always passes through mouseenter → isRowHovered=true → ref exists
      // - EPF jump-click: skips hover → isRowHovered=false → viewBtnRef is UNDEFINED
      // Reading .nativeElement.getBoundingClientRect().width crashes exactly
      // like the customer's: "Cannot read properties of undefined (reading 'width')"
      try {
        const width = (this.viewBtnRef as any).nativeElement.getBoundingClientRect().width;
        this.addLog('modal-width', `Button width = ${width}px (hovered before click ✅)`, 'success');
      } catch (err: any) {
        this.lastError = err.message;
        this.addLog('angular-error',
          `⛔ TypeError: ${err.message}  ← EPF skipped hover, viewBtnRef is undefined`,
          'error');
        console.error('%c⛔ Customer bug reproduced:', 'color:red;font-weight:bold', err);
      }
    }

    // Open the modal regardless
    this.isModalOpen = true;
    this.selectedOrder = order;

    if (!this.bugMode) {
      // ✅ CORRECT PATTERN:
      // 1. Set isModalOpen = true first (renders #modalBody via *ngIf)
      // 2. Read dimensions in setTimeout(0) — after Angular's change detection
      setTimeout(() => {
        if (this.modalBodyRef) {
          const width = this.modalBodyRef.nativeElement.getBoundingClientRect().width;
          this.addLog('modal-width', `✅ Modal width = ${width}px (correct timing)`, 'success');
        }
      }, 0);
    }

    this.addLog('modal-open', `Modal opened for ${order.id} [hover=${hoverState}]`,
      this.lastError ? 'warn' : 'success');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
    this.addLog('modal-close', 'Modal closed', 'info');
  }

  stopProp(e: Event): void { e.stopPropagation(); }

  clearLog(): void { this.eventLog = []; this.lastError = null; }

  clearMarkers(): void { this.markers = []; }

  resetStats(): void {
    this.stats = { pointerdown:0, mousedown:0, mouseup:0, click:0, dblclick:0, contextmenu:0 };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _on(event: string, handler: (e: Event) => void): void {
    const fn: EventListener = (e) => this.zone.run(() => handler(e));
    window.addEventListener(event, fn);
    this._handlers.push([event, fn]);
  }

  private addMarker(e: PointerEvent): void {
    const id = ++this.markerId;
    this.markers.push({ id, x: e.clientX, y: e.clientY,
      pointerType: e.pointerType || 'mouse', button: e.button, eventType: 'pointerdown' });
    const t = setTimeout(() => {
      this.zone.run(() => { this.markers = this.markers.filter(m => m.id !== id); });
    }, 1500);
    this.markerTimers.push(t);
  }

  private addLog(type: string, message: string, level: EventLevel = 'info'): void {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US',
      { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' }) +
      '.' + String(now.getMilliseconds()).padStart(3, '0');
    this.eventLog.unshift({ id: ++this.logId, time, type, message, level });
    if (this.eventLog.length > 50) this.eventLog.length = 50;
  }

  trackById(_: number, item: {id: number}) { return item.id; }
}
