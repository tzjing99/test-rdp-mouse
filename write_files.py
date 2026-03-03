import pathlib

HTML = """\
<!-- Angular Mouse Event Tester – EPF / SenseTalk RDP Diagnostic -->
<div class="page">

  <!-- HEADER -->
  <header class="header">
    <div class="header-brand">
      <span class="header-title">Mouse Event Tester</span>
      <span class="header-sub">EPF / SenseTalk RDP Diagnostic</span>
    </div>
    <div class="header-stats">
      <span class="stat"><span class="stat-label">Pointer</span><span class="stat-val">{{ currentPointerType }}</span></span>
      <span class="stat"><span class="stat-label">Clicks</span><span class="stat-val accent">{{ stats.click }}</span></span>
      <span class="stat"><span class="stat-label">Position</span><span class="stat-val mono">{{ lastPos.x }}, {{ lastPos.y }}</span></span>
    </div>
  </header>

  <div class="body">

    <!-- HOW TO USE -->
    <section class="card card-guide">
      <h2 class="card-title">How to Use This Tool</h2>
      <ol class="steps">
        <li class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Verify Mouse Events</strong> — check the <em>Event Counters</em> and <em>Live Event Log</em> below.
            Every click anywhere on the page is recorded with its type, position, and pointer device.
            A real mouse produces the full chain: <code>pointerdown</code> &rarr; <code>mousedown</code> &rarr; <code>mouseup</code> &rarr; <code>click</code>.
            Confirm EPF triggers the same sequence.
          </div>
        </li>
        <li class="step">
          <span class="step-num">2</span>
          <div>
            <strong>EPF Bug Reproduction</strong> — find row <strong>ORD-003</strong> in the table.
            Its "View Details" button only appears <em>after you hover</em> that row (guarded by <code>*ngIf="isRowHovered"</code>).
            <ul class="step-tips">
              <li><span class="tag tag-bug">Bug Mode ON</span> — native mouse works (hover first &rarr; button appears &rarr; click opens modal). EPF jump-clicks <em>without</em> hover &rarr; button is never in the DOM &rarr; <code>@ViewChild</code> is <code>undefined</code> &rarr; <strong>TypeError crash</strong>.</li>
              <li><span class="tag tag-fix">Fixed Mode</span> — the race condition is patched; EPF can now click without crashing.</li>
            </ul>
          </div>
        </li>
        <li class="step">
          <span class="step-num">3</span>
          <div>
            <strong>SenseTalk / EPF Targeting</strong> — use these test IDs in your script:
            <ul class="step-tips">
              <li>Row: <code>data-testid="modal-trigger-row"</code></li>
              <li>Button: <code>data-testid="btn-view-details"</code></li>
            </ul>
            Toggle bug mode to observe whether the ViewChild crash is reproduced.
          </div>
        </li>
      </ol>
    </section>

    <!-- BUG REPRODUCTION TABLE -->
    <section class="card" [class.card-bug]="bugMode" [class.card-fix]="!bugMode">
      <div class="card-header">
        <h2 class="card-title">EPF Bug Reproduction &mdash; ViewChild Race Condition</h2>
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="bugMode">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span class="toggle-text" [class.text-bug]="bugMode" [class.text-fix]="!bugMode">
            {{ bugMode ? '🐛 Bug Mode ON' : '✅ Fixed Mode' }}
          </span>
        </label>
      </div>

      <p class="card-desc" *ngIf="bugMode">
        <strong>Bug Mode:</strong> ORD-003's button is inside <code>*ngIf="isRowHovered"</code>.
        A native mouse always hovers before clicking (button renders &rarr; <code>@ViewChild</code> resolves &rarr; click works).
        EPF jump-clicks without hover &rarr; button never in DOM &rarr; <code>viewBtnRef</code> is <code>undefined</code> &rarr; <span class="err-text">TypeError</span>.
      </p>
      <p class="card-desc" *ngIf="!bugMode">
        <strong>Fixed Mode:</strong> The modal opens first, then reads the ViewChild inside <code>setTimeout(0)</code>
        after Angular's change detection runs. No crash regardless of hover state.
      </p>

      <!-- Error alert -->
      <div class="alert-error" *ngIf="lastError">
        <span class="alert-icon">⛔</span>
        <div>
          <div class="alert-title">TypeError reproduced!</div>
          <div class="alert-msg">{{ lastError }}</div>
          <div class="alert-hint">EPF skipped mouseenter &rarr; viewBtnRef was never rendered into the DOM</div>
        </div>
      </div>

      <!-- Orders table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders"
              [class.row-special]="order.isSpecialRow"
              [class.row-hovered]="order.isSpecialRow && isRowHovered"
              (mouseenter)="order.isSpecialRow && onRowMouseEnter(order)"
              (mouseleave)="order.isSpecialRow && onRowMouseLeave()"
              [attr.data-order-id]="order.id"
              [attr.data-testid]="order.isSpecialRow ? 'modal-trigger-row' : null">
              <td class="td-mono">{{ order.id }}</td>
              <td>{{ order.customer }}</td>
              <td>{{ order.product }}</td>
              <td>
                <span class="chip" [ngClass]="'chip-' + order.status.toLowerCase()">{{ order.status }}</span>
              </td>
              <td class="td-action">
                <button *ngIf="order.isSpecialRow && isRowHovered"
                  #viewBtn class="btn-primary"
                  id="btn-view-details"
                  data-testid="btn-view-details"
                  (click)="openModal(order, $event)">
                  View Details
                </button>
                <span *ngIf="order.isSpecialRow && !isRowHovered" class="hover-hint">
                  &larr; hover row to reveal
                </span>
                <span *ngIf="!order.isSpecialRow" class="td-dash">&mdash;</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- EVENT COUNTERS -->
    <section class="card">
      <div class="card-header">
        <h2 class="card-title">Event Counters</h2>
        <button class="btn-ghost" (click)="resetStats()">Reset</button>
      </div>
      <div class="counters">
        <div class="counter" *ngFor="let s of [
          {label:'pointerdown', val: stats.pointerdown},
          {label:'mousedown',   val: stats.mousedown},
          {label:'mouseup',     val: stats.mouseup},
          {label:'click',       val: stats.click},
          {label:'dblclick',    val: stats.dblclick},
          {label:'contextmenu', val: stats.contextmenu}
        ]">
          <span class="counter-val">{{ s.val }}</span>
          <span class="counter-label">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- LIVE EVENT LOG -->
    <section class="card">
      <div class="card-header">
        <h2 class="card-title">Live Event Log</h2>
        <button class="btn-ghost" (click)="clearLog()">Clear</button>
      </div>
      <div class="log">
        <div class="log-empty" *ngIf="eventLog.length === 0">
          No events yet &mdash; interact with the page to start recording.
        </div>
        <div *ngFor="let e of eventLog; trackBy: trackById"
          class="log-row"
          [class.log-success]="e.level === 'success'"
          [class.log-warn]="e.level === 'warn'"
          [class.log-error]="e.level === 'error'">
          <span class="log-time">{{ e.time }}</span>
          <span class="log-type">{{ e.type }}</span>
          <span class="log-msg">{{ e.message }}</span>
        </div>
      </div>
    </section>

  </div>
</div>

<!-- MODAL -->
<div class="modal-backdrop" *ngIf="isModalOpen" (click)="closeModal()">
  <div class="modal" role="dialog" (click)="stopProp($event)">
    <div class="modal-header">
      <div>
        <p class="modal-eyebrow">Order Details</p>
        <h3 class="modal-title">{{ selectedOrder?.id }}</h3>
      </div>
      <button class="modal-close" (click)="closeModal()" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body" #modalBody *ngIf="selectedOrder">
      <div class="detail-grid">
        <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-val">{{ selectedOrder.customer }}</span></div>
        <div class="detail-row"><span class="detail-label">Product</span><span class="detail-val">{{ selectedOrder.product }}</span></div>
        <div class="detail-row"><span class="detail-label">Quantity</span><span class="detail-val">{{ selectedOrder.qty }}</span></div>
        <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-val strong">{{ selectedOrder.amount | currency }}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-val"><span class="chip" [ngClass]="'chip-' + selectedOrder.status.toLowerCase()">{{ selectedOrder.status }}</span></span></div>
        <div class="detail-row detail-row-full"><span class="detail-label">Notes</span><span class="detail-val muted">{{ selectedOrder.details }}</span></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" (click)="closeModal()">Close</button>
    </div>
  </div>
</div>

<!-- Click dot markers -->
<div *ngFor="let m of markers; trackBy: trackById"
  class="dot"
  [class.dot-left]="m.button === 0"
  [class.dot-right]="m.button === 2"
  [class.dot-mid]="m.button === 1"
  [style.left.px]="m.x" [style.top.px]="m.y">
</div>
"""

CSS = """\
/* ============================================================
   TOKENS
============================================================ */
:root {
  --bg:        #0b0d14;
  --surface:   #111420;
  --surface-2: #181c2b;
  --border:    #252840;
  --border-2:  #2e3350;

  --text:      #eef0ff;
  --text-2:    #8890b8;
  --text-3:    #4a5070;

  --blue:      #4f8ef7;
  --green:     #34d399;
  --amber:     #fbbf24;
  --rose:      #f87171;
  --indigo:    #818cf8;

  --r:   8px;
  --r-lg: 12px;
  --font: 'Inter', 'Segoe UI', system-ui, sans-serif;
  --mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 13px; -webkit-font-smoothing: antialiased; }
body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }

code {
  font-family: var(--mono); font-size: .82em;
  color: var(--indigo); background: rgba(129,140,248,.1);
  padding: 1px 5px; border-radius: 4px;
}

/* ============================================================
   PAGE SHELL
============================================================ */
.page { display: flex; flex-direction: column; min-height: 100vh; }

.body {
  max-width: 840px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ============================================================
   HEADER
============================================================ */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 50px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-wrap: wrap;
}

.header-brand { display: flex; align-items: baseline; gap: 10px; }

.header-title {
  font-size: 1rem; font-weight: 800;
  color: var(--text); letter-spacing: -.02em;
}

.header-sub {
  font-size: .72rem; color: var(--text-3);
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 2px 8px; border-radius: 20px;
}

.header-stats { display: flex; align-items: center; gap: 20px; }

.stat { display: flex; flex-direction: column; align-items: flex-end; }
.stat-label { font-size: .62rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); }
.stat-val  { font-size: .85rem; font-weight: 700; color: var(--text-2); }
.stat-val.accent { color: var(--blue); }
.stat-val.mono { font-family: var(--mono); font-size: .78rem; }

/* ============================================================
   CARDS
============================================================ */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.card-guide { border-color: rgba(79,142,247,.2); }
.card-bug   { border-color: rgba(248,113,113,.3); }
.card-fix   { border-color: rgba(52,211,153,.25); }

.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 16px;
  background: var(--surface-2); border-bottom: 1px solid var(--border);
}

.card-title {
  font-size: .85rem; font-weight: 700;
  color: var(--text); letter-spacing: -.01em;
}

.card-desc {
  padding: 10px 16px;
  font-size: .8rem; color: var(--text-2); line-height: 1.7;
  border-bottom: 1px solid var(--border);
}

.err-text { color: var(--rose); font-weight: 700; }

/* ============================================================
   HOW TO USE
============================================================ */
.steps {
  list-style: none;
  padding: 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step {
  display: flex;
  gap: 12px;
  font-size: .8rem;
  color: var(--text-2);
  line-height: 1.7;
}

.step-num {
  flex-shrink: 0;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
  font-size: .72rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}

.step strong { color: var(--text); }

.step-tips {
  list-style: none;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.step-tips li::before { content: '• '; color: var(--text-3); }

.tag {
  display: inline;
  padding: 1px 7px; border-radius: 20px;
  font-size: .72rem; font-weight: 700;
}
.tag-bug { background: rgba(248,113,113,.12); color: var(--rose); border: 1px solid rgba(248,113,113,.25); }
.tag-fix { background: rgba(52,211,153,.1); color: var(--green); border: 1px solid rgba(52,211,153,.22); }

/* ============================================================
   TOGGLE
============================================================ */
.toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle input { display: none; }

.toggle-track {
  position: relative; width: 34px; height: 18px;
  background: var(--surface-2); border: 1px solid var(--border-2);
  border-radius: 20px; flex-shrink: 0;
  transition: background .2s, border-color .2s;
}
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--text-3); transition: all .2s;
}
.toggle input:checked ~ .toggle-track { background: rgba(248,113,113,.2); border-color: var(--rose); }
.toggle input:checked ~ .toggle-track .toggle-thumb { left: 18px; background: var(--rose); }

.toggle-text { font-size: .78rem; font-weight: 700; white-space: nowrap; }
.text-bug { color: var(--rose); }
.text-fix { color: var(--green); }

/* ============================================================
   ALERT
============================================================ */
.alert-error {
  display: flex; gap: 10px;
  margin: 10px 16px; padding: 10px 14px;
  border-radius: var(--r);
  background: rgba(248,113,113,.07);
  border: 1px solid rgba(248,113,113,.3);
  animation: shake .3s ease;
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-6px); }
  75%     { transform: translateX(6px); }
}
.alert-icon  { font-size: 1.2rem; flex-shrink: 0; line-height: 1.5; }
.alert-title { font-size: .8rem; font-weight: 700; color: var(--rose); }
.alert-msg   { font-size: .75rem; color: var(--text-2); margin-top: 2px; font-family: var(--mono); }
.alert-hint  { font-size: .7rem; color: var(--text-3); margin-top: 4px; }

/* ============================================================
   TABLE
============================================================ */
.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: .8rem; }

thead tr { background: var(--surface-2); border-bottom: 1px solid var(--border-2); }

th {
  padding: 8px 14px; text-align: left;
  font-size: .67rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .07em;
  color: var(--text-3);
}

td {
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  color: var(--text-2); vertical-align: middle;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--surface-2); color: var(--text); }

.td-mono   { font-family: var(--mono); font-size: .75rem; color: var(--text-3); }
.td-action { width: 160px; }
.td-dash   { color: var(--border-2); }

.row-special td { background: rgba(79,142,247,.04); }
.row-hovered td { background: rgba(79,142,247,.1) !important; }

.hover-hint {
  font-size: .72rem; color: var(--text-3);
  font-style: italic;
}

/* ============================================================
   CHIPS
============================================================ */
.chip {
  display: inline-flex; align-items: center;
  padding: 2px 9px; border-radius: 20px;
  font-size: .68rem; font-weight: 700;
  border: 1px solid transparent;
}
.chip-shipped    { background: rgba(79,142,247,.12);  color: var(--blue);    border-color: rgba(79,142,247,.25); }
.chip-processing { background: rgba(251,191,36,.1);   color: var(--amber);   border-color: rgba(251,191,36,.25); }
.chip-pending    { background: rgba(248,113,113,.1);  color: var(--rose);    border-color: rgba(248,113,113,.25); }
.chip-delivered  { background: rgba(52,211,153,.1);   color: var(--green);   border-color: rgba(52,211,153,.25); }
.chip-cancelled  { background: rgba(139,144,174,.1);  color: var(--text-3);  border-color: var(--border); }

/* ============================================================
   COUNTERS
============================================================ */
.counters {
  display: grid; grid-template-columns: repeat(6, 1fr);
  gap: 1px; background: var(--border);
}
@media (max-width: 600px) { .counters { grid-template-columns: repeat(3, 1fr); } }

.counter {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 14px 6px; background: var(--surface); gap: 3px;
  transition: background .15s;
}
.counter:hover { background: var(--surface-2); }

.counter-val {
  font-size: 1.6rem; font-weight: 800;
  font-variant-numeric: tabular-nums; line-height: 1;
  color: var(--text);
}
.counter-label {
  font-size: .63rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em;
  color: var(--text-3);
}

/* ============================================================
   EVENT LOG
============================================================ */
.log {
  max-height: 260px; overflow-y: auto;
  padding: 4px 0;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
}

.log-empty { padding: 18px 16px; font-size: .78rem; color: var(--text-3); font-style: italic; }

.log-row {
  display: grid; grid-template-columns: 106px 140px 1fr;
  gap: 0 8px; padding: 5px 16px;
  border-bottom: 1px solid rgba(37,40,64,.6);
  font-size: .73rem; font-family: var(--mono);
  align-items: baseline; transition: background .1s;
}
.log-row:hover { background: var(--surface-2); }
.log-row:last-child { border-bottom: none; }

.log-time { color: var(--text-3); }
.log-type { color: var(--indigo); font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log-msg  { color: var(--text-2); word-break: break-all; }

.log-success .log-type { color: var(--green); }
.log-success .log-msg  { color: #86efac; }
.log-warn    .log-type { color: var(--amber); }
.log-warn    .log-msg  { color: #fde68a; }
.log-error   .log-type { color: var(--rose); }
.log-error   .log-msg  { color: #fca5a5; }

/* ============================================================
   BUTTONS
============================================================ */
.btn-primary {
  background: var(--blue); color: #fff; border: none;
  padding: 6px 14px; border-radius: var(--r);
  font-size: .76rem; font-weight: 700; cursor: pointer;
  transition: background .15s, box-shadow .15s; white-space: nowrap;
}
.btn-primary:hover { background: #6ba3f9; box-shadow: 0 0 12px rgba(79,142,247,.4); }

.btn-ghost {
  background: transparent; border: 1px solid var(--border-2);
  color: var(--text-3); font-size: .72rem; font-weight: 600;
  cursor: pointer; padding: 4px 10px; border-radius: var(--r);
  transition: all .15s;
}
.btn-ghost:hover { color: var(--text); border-color: var(--text-3); background: var(--surface-2); }

/* ============================================================
   CLICK DOT MARKERS
============================================================ */
.dot {
  position: fixed; width: 12px; height: 12px;
  border-radius: 50%; transform: translate(-50%, -50%);
  pointer-events: none; z-index: 9999;
  animation: dotPop .18s ease, dotFade 1.5s ease forwards;
}
.dot-left  { background: var(--blue);  box-shadow: 0 0 10px rgba(79,142,247,.7); }
.dot-right { background: var(--rose);  box-shadow: 0 0 10px rgba(248,113,113,.7); }
.dot-mid   { background: var(--amber); box-shadow: 0 0 10px rgba(251,191,36,.7); }

@keyframes dotPop  { 0%{transform:translate(-50%,-50%)scale(0)} 60%{transform:translate(-50%,-50%)scale(1.5)} 100%{transform:translate(-50%,-50%)scale(1)} }
@keyframes dotFade { 0%,60%{opacity:1} 100%{opacity:0} }

/* ============================================================
   MODAL
============================================================ */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9000; animation: fadeIn .15s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

.modal {
  background: var(--surface); border: 1px solid var(--border-2);
  border-radius: var(--r-lg); width: 440px; max-width: 95vw;
  box-shadow: 0 24px 60px rgba(0,0,0,.6);
  animation: slideUp .18s cubic-bezier(.22,1,.36,1); overflow: hidden;
}
@keyframes slideUp { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }

.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 18px 12px; border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}
.modal-eyebrow { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--blue); margin-bottom: 3px; }
.modal-title   { font-size: 1.1rem; font-weight: 800; color: var(--text); font-family: var(--mono); }

.modal-close {
  background: transparent; border: 1px solid var(--border);
  color: var(--text-3); width: 26px; height: 26px;
  border-radius: 6px; font-size: 1.1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.modal-close:hover { color: var(--text); border-color: var(--border-2); background: var(--surface-2); }

.modal-body { padding: 16px 18px; }

.detail-grid { display: flex; flex-direction: column; }

.detail-row {
  display: grid; grid-template-columns: 84px 1fr;
  gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border);
  align-items: center;
}
.detail-row:first-child { padding-top: 0; }
.detail-row:last-child  { border-bottom: none; padding-bottom: 0; }
.detail-row-full        { align-items: flex-start; }

.detail-label { font-size: .67rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); }
.detail-val   { font-size: .82rem; color: var(--text-2); }
.detail-val.strong { color: var(--text); font-weight: 700; }
.detail-val.muted  { color: var(--text-3); font-size: .78rem; line-height: 1.6; }

.modal-footer {
  padding: 10px 18px; border-top: 1px solid var(--border);
  background: var(--surface-2); display: flex; justify-content: flex-end;
}

/* ============================================================
   RESPONSIVE
============================================================ */
@media (max-width: 600px) {
  .header       { height: auto; padding: 10px 14px; flex-wrap: wrap; }
  .header-stats { gap: 12px; }
  .log-row      { grid-template-columns: 76px 100px 1fr; }
}
"""

base = pathlib.Path(r"src/app")
(base / "app.component.html").write_text(HTML, encoding="utf-8")
(base / "app.component.css").write_text(CSS, encoding="utf-8")
print(f"HTML: {(base / 'app.component.html').stat().st_size} bytes")
print(f"CSS:  {(base / 'app.component.css').stat().st_size} bytes")
