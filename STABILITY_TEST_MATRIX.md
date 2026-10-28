# Release regression test matrix

The pass condition is: **same visible result and feature behavior as current main, with one-tap controls and reliable text focus.**

| Area | Test | Expected |
|---|---|---|
| Login | Tap character, tap PIN once, type 4 digits | Selection unchanged; keyboard/focus works on first tap |
| Global nav | HOME / MAIL / SECRET / WISH | Exactly one route change per tap |
| Header | Profile and inbox | Opens once; no double navigation |
| HOME | Tap a character mood | Same emoji bubble, once per tap |
| MAIL | Tap textarea and type | Focus/typing works first tap |
| MAIL | Recipient picker | Opens/closes once; recipient action fires once |
| SECRET | Mission textarea | Focus/typing works first tap |
| SECRET | PASS / submit / wishlist action | One action per tap; existing flow unchanged |
| WISH | Edit text and save/cancel | Existing values/layout preserved |
| BOARD | Compose text and post | Input works; one post action |
| ME | Mood input | Keyboard opens and emoji can be entered |
| ME | Calendar controls | Prev/next/day modal unchanged |
| Admin | Existing controls | Same actions and visual output |
| Party | Existing controls | Same actions and visual output |

Run the input/tap rows on iPhone Safari or installed PWA before merging to main.
