# Continuous, bounded clock transitions

The direct text / pattern route described here is superseded by [moving formation passages](orderly-passages.md). The speed bounds, derivative continuity and wall-clock scheduling remain in use; departures from text to patterns now cross a moving formation, while returns to text connect directly.

## Context & Goals

The user wants the mandatory parallel staging pose removed and all transitions to stay calm. The previous AMT144 implementation routed pieces through a staging pose, added full turns to counter-rotation entries, shortened staggered hands' travel time, and compressed scores to meet minute deadlines. Measured baseline peaks are 180.8 degrees/s entering pieces, 112.8 degrees/s returning to time, and 153.4 degrees/s in minute updates.

## Requirements & Invariants

- Preserve the AMT144 layout, single HTML Canvas implementation, rounded pivots, and existing characters and pattern families.
- Connect current motion directly to the next field, character, or time pose. No mandatory parallel, rings, or other intermediate static pose; parallel remains a manually selectable pattern.
- Keep normal playback calm, including interrupted transitions. Preserve the 0.25–3× control; the user explicitly allows faster speeds for debugging. The normal-speed implementation target is at most 30 degrees/s at 1×, with debug rates above 1× scaling that limit proportionally.
- Preserve angle, angular velocity, and angular acceleration across authored trajectory boundaries.
- Preserve correct minute-boundary arrivals in Active / Original without speeding up a transition to catch a deadline.

## Proposed Solution

Score owns all transition planning. A common connector routes equivalent angles and, when appropriate, exchanges a cell's target angles to reduce travel. Short acceleration ramps carry each hand's existing velocity into and out of an acceleration-free quintic connector; they never force the hand to stop or form a shared pose. This avoids trying to stretch a nonzero endpoint acceleration over a long quintic, which can itself create velocity overshoot.

Quintic derivative polynomials are converted to Bernstein control values. Subdivision and the convex hull bound provide a conservative whole-segment speed and acceleration bound, including peaks between rendered frames. Increase the common transition duration until every hand fits the bound. Endpoints with nonzero acceleration use bounded acceleration ramps; the middle connector has zero endpoint acceleration and can always be lengthened for feasible bounded endpoint velocities.

Authored fields use a slower shared tempo. buildPerformance consists of the direct entry connector followed by the continuous field, with no staging, forced extra turn, braking to a shared rest pose, or trailing alignment. Returning to a static pose also uses the common connector directly.

Director retains the artistic clock and wall clock. Playback retains 0.25–3×, with gradual rate changes and a visible debug label above 1×. Normal rates stay within 1×; Active / Original return smoothly to 1× and remain locked there. Active / Original compile the complete entry, flow, and return before starting, shorten the flow if necessary, and wait on the existing clock pose for any spare time before departure. The complete score ends on the next minute; no score is compressed. If a late start cannot fit even a shortened full piece, only the minute update is scheduled. Minimal schedules its necessary movement ahead of the minute; late resumptions finish calmly instead of rushing. Manual returns plan their duration before selecting the arrival-time digits.

## Implementation Plan

1. Add trajectory derivative bounds and the common bounded connector.
2. Remove staging and stop-start sequences; connect continuous fields and poses directly.
3. Adjust playback and minute scheduling around safe, computed durations.
4. Expand regression tests to cover every family, interrupted transitions, all UI destinations, speed settings, and minute deadlines.
5. Inspect representative motion in the browser, update research / usage documentation, and deploy the same single HTML to the existing AMT144 project.

## Trade-offs & Risks

Transitions with large angle changes will take longer. Minute modes may spend less time in the flowing section or more time displaying the current minute before departure. The 30 degrees/s guarantee applies at 1× and below; debug acceleration deliberately increases actual speed. Rate changes also scale the authored acceleration, so the 15 degrees/s² trajectory limit is not a claim about physical acceleration during rate ramps. The 30 degrees/s limit is an aesthetic choice for this implementation, not an asserted original motor specification.

## Validation & Rollout

Verify derivative bounds against dense independent samples, C2 joins across all tracks, preservation of interruption states, and a physical speed cap under playback-rate changes. Exercise every catalog sequence and every minute-mode return, including near midnight and visibility / pause recovery. Verify that automatic performances contain no mandatory intermediate resting pose. Retain the existing AMT144 glyph and responsive checks. No data migration or external dependency is needed.

Validation completed: 19 tests pass, including all interrupted sequence pairs, every manual target, polynomial-bound checks against dense samples, minute / midnight changes, arrival prediction, normal-rate physical speed, and 3× debug playback. Existing AMT144 glyph and pivot rendering checks remain intact.
