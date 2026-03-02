import { Component, OnInit, NgZone } from '@angular/core';

export interface Order {
  id: string;
  customer: string;
  product: string;
  qty: number;
  amount: number;
  status: string;
  details: string;
  isSpecialRow: boolean; // This row is the one that must open a modal
}

export interface EventLogEntry {
  time: string;
  type: string;
  message: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'RDP Mouse Test – Modal Dialog Demo';

  orders: Order[] = [
    {
      id: 'ORD-001', customer: 'Alice Johnson', product: 'Widget A',
      qty: 2, amount: 150.00, status: 'Shipped', details: 'Shipped via FedEx. Tracking: FX123456.',
      isSpecialRow: false
    },
    {
      id: 'ORD-002', customer: 'Bob Smith', product: 'Widget B',
      qty: 5, amount: 220.50, status: 'Processing', details: 'Payment verified. Preparing shipment.',
      isSpecialRow: false
    },
    {
      id: 'ORD-003', customer: 'Charlie Brown', product: 'Widget C',
      qty: 1, amount: 75.25, status: 'Pending',
      details: 'Awaiting supplier confirmation. ETA 3 business days.',
      isSpecialRow: true  // <-- The special "problem" row that opens a modal
    },
    {
      id: 'ORD-004', customer: 'Diana Prince', product: 'Widget D',
      qty: 3, amount: 410.00, status: 'Delivered', details: 'Delivered on 2026-02-28. Signed by D. Prince.',
      isSpecialRow: false
    },
    {
      id: 'ORD-005', customer: 'Eve Wilson', product: 'Widget E',
      qty: 7, amount: 90.00, status: 'Cancelled', details: 'Cancelled by customer request on 2026-02-20.',
      isSpecialRow: false
    }
  ];

  selectedOrder: Order | null = null;
  isModalOpen = false;
  eventLog: EventLogEntry[] = [];

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    // Attach global diagnostic listeners so we can see what EPF sends
    window.addEventListener('pointerdown', (e: PointerEvent) => {
      this.zone.run(() => this.addLog('pointerdown',
        `pointerType=${e.pointerType} | button=${e.button} | (${Math.round(e.clientX)},${Math.round(e.clientY)})`,
        'info'));
    });
    window.addEventListener('mousedown', (e: MouseEvent) => {
      this.zone.run(() => this.addLog('mousedown',
        `button=${e.button} | (${Math.round(e.clientX)},${Math.round(e.clientY)})`,
        'info'));
    });
    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.zone.run(() => this.addLog('mouseup',
        `button=${e.button} | (${Math.round(e.clientX)},${Math.round(e.clientY)})`,
        'info'));
    });
    window.addEventListener('click', (e: MouseEvent) => {
      this.zone.run(() => this.addLog('click',
        `button=${e.button} | (${Math.round(e.clientX)},${Math.round(e.clientY)})`,
        'success'));
    });
  }

  openModal(order: Order, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedOrder = order;
    this.isModalOpen = true;
    this.addLog('angular-click', `openModal() called for ${order.id}`, 'success');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
    this.addLog('modal', 'Modal closed', 'info');
  }

  stopProp(event: Event): void {
    event.stopPropagation();
  }

  onRowPointerDown(event: PointerEvent, order: Order): void {
    this.addLog('row-pointerdown',
      `${order.id} – pointerType=${event.pointerType} button=${event.button}`, 'info');
  }

  onRowMouseEnter(order: Order): void {
    this.addLog('mouseenter', `Hovering over ${order.id}`, 'info');
  }

  clearLog(): void {
    this.eventLog = [];
  }

  private addLog(type: string, message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
    this.eventLog.unshift({
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message
    });
    if (this.eventLog.length > 20) {
      this.eventLog.length = 20;
    }
  }
}

