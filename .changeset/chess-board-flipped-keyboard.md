---
"@multi-game-engines/ui-chess-elements": patch
---

Fix keyboard navigation when `orientation="black"` (flipped board).

Arrow keys, Home/End, and PageUp/PageDown now move focus in visual coordinates
rather than logical coordinates, so a screen reader user pressing ArrowUp always
moves to the visually higher square regardless of board orientation.

ARIA labels were already generated from logical (algebraic) coordinates and
remain correct in both orientations.
