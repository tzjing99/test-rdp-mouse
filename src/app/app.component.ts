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
  // #modalBody is inside *ngIf="isModalOpen" — it is UNDEFINED while modal is closed.
  // Accessing it before isModalOpen = true reproduces the customer's JS error.
  @ViewChild('modalBody') modalBodyRef?: ElementRef;

  isModalOpen = false;
  selectedOrder: Order | null = null;

  // ── Bug-reproduction toggle ────────────────────────────────────────────────
  bugMode = true;   // true = reproduce the crash, false = correct Angular pattern
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

  // ── Modal: reproduces / fixes the ViewChild crash ─────────────────────────
  openModal(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.lastError = null;

    if (this.bugMode) {
      // ⚠ BUG REPRODUCTION:
      // modalBodyRef is inside *ngIf="isModalOpen" which is still FALSE here.
      // Angular has NOT rendered #modalBody yet → it is undefined.
      // Accessing .nativeElement crashes exactly like the customer's app.
      try {
        const width = (this.modalBodyRef as any).nativeElement.getBoundingClientRect().width;
        this.addLog('modal-width', `Modal body width = ${width}px`, 'info');
      } catch (err: any) {
        this.lastError = err.message;
        this.addLog('angular-error',
          `Uncaught TypeError: ${err.message}  ← same crash as customer app`,
          'error');
        console.error('%c⛔ Angular Error reproduced:', 'color:red;font-weight:bold', err);
      }
    }

    // Whether buggy or not, open the modal afterwards
    this.isModalOpen = true;
    this.selectedOrder = order;

    if (!this.bugMode) {
      // ✅ CORRECT PATTERN: read dimensions AFTER the view has updated
      // Use setTimeout(0) so Angular renders *ngIf first
      setTimeout(() => {
        if (this.modalBodyRef) {
          const width = this.modalBodyRef.nativeElement.getBoundingClientRect().width;
          this.addLog('modal-width', `✅ Modal body width = ${width}px (correct timing)`, 'success');
        }
      }, 0);
    }

    this.addLog('modal-open', `Modal opened for ${order.id} (bugMode=${this.bugMode})`,
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
