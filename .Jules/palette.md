# Palette's Journal

## 2026-02-11 - [Accessibility in Dynamic Content]
**Learning:** Screen readers often ignore dynamic updates unless explicitly told otherwise. For a progress bar, simply updating the visual width is insufficient. It requires `role="progressbar"` and updates to `aria-valuenow`. For log areas, `aria-live="polite"` ensures new messages are announced without interrupting the user.
**Action:** Always pair visual status updates with corresponding ARIA attribute updates (e.g., `element.setAttribute('aria-valuenow', value)`).
