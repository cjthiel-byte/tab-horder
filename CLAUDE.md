# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Tab Hoarder** — a browser-native survival game. Tabs keep spawning as floating cards, each containing a mini-game. Complete them before they expire or the browser "crashes" (5 health points).

No build step. Open `index.html` directly in a browser to run.

## File structure

- `index.html` — all DOM structure; start screen, browser chrome bar, tab area, crash screen
- `styles.css` — all visual styling; CSS variables defined in `:root`
- `game.js` — all game logic (single file, no modules)

## Architecture

**State** lives in the module-level `S` object (reset via `newState()`). Never modify `S` directly outside the game lifecycle functions.

**Tab lifecycle**: `spawnTab()` → mini-game runs → `completeTab(id)` or `expireTab(id)` → `dropTab(id)`. Each tab object in `S.tabs` (a `Map`) holds `{ done, gone, cleanup, element, deadline }`.

**Mini-game pattern**: each `mk*` function returns `{ el, cleanup }`. The `el` is appended to the card. `cleanup` cancels intervals/rAFs and must always be called before removing a tab.

**Drag**: single global `drag` variable; `mousemove`/`mouseup` listeners on `document` (added once in `initDrag`). `makeDraggable(card, handle)` only sets the `mousedown` on the drag handle.

**Tick loop** (100ms): updates timer fill bars, checks expiry. **Clock loop** (1s): updates elapsed time, triggers difficulty scaling checks.

**Difficulty scaling** thresholds (all checked in `clockTick`):
- Every 30s: spawn rate +10% (min 800ms)
- 60s: fake tabs enabled
- 120s: panic tabs enabled
- 180s: double-spawn per interval

## Tab types

| Constant | Key mechanic | Normal time | Panic time |
|---|---|---|---|
| `T.CLICK_SPAM` | Click 15 times | 7s | 5s |
| `T.TIMER_HOLD` | Hold 3s ±0.35s | 8s | 5s (±0.18s) |
| `T.MEMORY` | Repeat 3-symbol sequence | 10s | 5s (1.4s display) |
| `T.PRECISION` | Click moving target | 6s | 5s (2× speed) |
| `T.FAKE` | Looks like click spam, never completable | 8s | — |
| `T.PANIC` | Wraps one of the 4 base types | — | 5s |

## Scoring

- Complete tab: `+100 × multiplier`
- Multiplier: 1× → 1.5× → 2× → 2.5× → 3× (cap) every 3 consecutive completions
- Any expiry resets streak and multiplier to 1×
