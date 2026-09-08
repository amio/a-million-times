# Integrated choreography controls

## Context and goal

Bring choreography inspection into Controls, and make the existing toolbar progress element draggable. Selection, rules, cue poses, and official reference material should be usable without navigating to a separate interface.

## Behavior and ownership

Use one sequence selector and the existing Director. The toolbar range displays main-sequence time; dragging calls the existing inspection operation, pauses playback, and resumption follows the same score. Static displays and real-minute modes disable manual scrubbing. Cue buttons use the same inspection operation. Director owns explicit transport: Play leaves manual pattern, text, and time displays and starts the selected choreography; Resume after inspection keeps the existing score. Background resumption leaves manual displays intact. Rules and official imagery belong to a collapsible section in Controls.

Preserve existing `?study=1&piece=...&at=...` links by opening Controls at the requested paused pose. They use the same interface as normal playback. Opening and closing Controls does not alter playback. Preserve the current canvas margin ratios and all motion rules. CSS reserves space for open Controls beside the matrix, or below it on phones. A ResizeObserver keeps the renderer matched to its actual container.

## Implementation and validation

Remove the separate study layout, duplicate selector, and inner timeline. Reuse the toolbar's progress position for an accessible range input, including keyboard control. Keep the source inventory and guide links in Controls. Verify seek/pause/resume, cue selection, static and timed modes, old links, panel dismissal, responsive layout, and the existing trajectory checks. No persistence or data migration is required.

Validation: all 39 existing tests pass. Browser checks cover toolbar pointer and keyboard seeking, pause/resume, cue selection, static and timed modes, reference images, and legacy study links. Desktop and 390 × 844 phone layouts keep the canvas clear of Controls and preserve the margin ratios. The choreography engine is unchanged.
