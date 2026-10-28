# Deferred architecture cleanup

These are real maintenance issues, but they are intentionally not rewritten before release because visible behavior must remain frozen.

- Multiple modules reassign core functions such as `shell`, `home`, `me`, and `secret` to layer features.
- Several CSS files intentionally override earlier selectors and depend on stylesheet order.
- Some page functions render a placeholder, await remote data, then replace the route DOM.

A post-release refactor should replace function reassignment with explicit composition and add browser-level visual/interaction regression tests first. Until those tests exist, deleting these wrappers or flattening the CSS cascade would carry more regression risk than stability benefit.
