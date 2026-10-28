# Pre-release stability cleanup

This branch is intentionally behavior-preserving.

## Invariants
- Do not change the final UI, layout, copy, or visual styling.
- Do not remove or alter user-facing features.
- Do not change Supabase schema or stored-data semantics.
- Prefer browser-native click/focus behavior over synthetic pointer-to-click conversion.
- Remove duplicate event paths only when the same user action and result are preserved.
- Keep `main` untouched until the stability branch is manually verified.

## Current fixes
- `navigation.js`: removed global pointerup -> synthetic click handling; navigation remains delegated.
- `mailbox-tab.js`: recipient selection uses one native click path.
- `mood-status.js`: tree mood bubbles use native click + keyboard activation instead of pointerup/click split.

## Manual regression pass before merge
1. Login: select character, focus PIN input, type PIN, enter.
2. HOME: nav buttons, profile/avatar, inbox, tree racers/mood bubble, party/date controls when applicable.
3. MAIL: type in textarea, open recipient picker, cancel, choose each recipient type, anonymous toggle, send.
4. SECRET: draw, mission textarea, PASS, message/mailbox/board mission submit, wishlist action.
5. WISH: open people, edit fields, type, save/cancel, return navigation.
6. BOARD: open notes, compose/type/post, close modal.
7. ME: mood input, calendar prev/next/day modal, logout.
8. Admin/party flows: existing controls and filters.
9. Repeat critical input tests on iPhone Safari/PWA: tap input once, keyboard appears, typing is not lost; buttons fire once per tap.
