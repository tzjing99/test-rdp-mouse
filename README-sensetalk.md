**Overview**: This workspace contains a small Angular 14 demo app that reproduces a modal-opening table row. Use Eggplant Functional (SenseTalk) to click the `View Details` button and validate event behavior via the live event log.

- Run the app: `npm install` then `npm start` (or `npm run start`). The app listens on the usual Angular dev server port (4200) by default.

- Demo target:
  - The special row has `data-testid="modal-trigger-row"` and the button has `data-testid="btn-view-details"`.

- SenseTalk examples:
  - `scripts/click_modal.st` contains an image-based example that waits for `btn-view-details.png` and clicks it using `moveto` and `mouseButtonDown/mouseButtonUp`.
  - A coordinate fallback is provided — adjust X/Y values to your environment.

- Diagnostic tips:
  - The Angular app logs pointer/mouse events in the "Live Event Log" panel. Use this to compare native RDP clicks vs EPF/SenseTalk clicks.
  - If SenseTalk clicks don't change the cursor to a pointer/hand, try increasing the delay between `mouseButtonDown` and `mouseButtonUp` (e.g. `wait 0.15`) or perform a small move before the click.

