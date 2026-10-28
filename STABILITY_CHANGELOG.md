# Stability changelog

All changes on this branch are intended to preserve the existing visible UI and feature behavior.

## Interaction path cleanup

### Navigation
Removed the document-level pointer gesture synthesizer that called `.click()` from `pointerup`. Native browser click/focus behavior is retained. Route navigation remains delegated so it survives `#app` replacement.

### Mailbox recipient picker
Recipient buttons now have one click path instead of separate pointer and click paths.

### HOME mood bubbles
Tree racer mood bubbles now use native click plus Enter/Space keyboard activation. The displayed emoji and timeout behavior are unchanged.

### Header / mailbox wrappers
Redundant route/bind wrappers were removed where the late-loaded authoritative navigation module already owns the same responsibility.

## Cache refresh
Updated script query versions for changed runtime files so a phone is less likely to execute stale cached JavaScript after deployment.

## Deliberately deferred
Large CSS consolidation and wholesale removal of `home`/`me`/`secret` wrappers are deferred because the current finished UI and feature composition depend on module load order. Those changes need visual/browser regression coverage and are not appropriate as blind pre-release cleanup.
