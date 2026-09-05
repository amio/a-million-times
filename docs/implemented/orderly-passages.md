# Moving formation passages

## Context & Goals

Direct transitions between clock typography and spatial fields scatter the letter strokes into unrelated orientations. The user wants an orderly whole-matrix intermediate formation, with several simple, flat formations and no dwell before the following transition. Complex static display patterns do not consistently provide that order; organizing formations now have their own restricted catalog and are selected randomly.

## Requirements & Invariants

- Pass through a clear, full-matrix formation only when leaving time / text for a pattern. Return from a pattern directly to time / text: the destination typography supplies the order.
- Keep organizing formations separate from manual static patterns, choose them randomly, and continue immediately through each formation without stopping there.
- Preserve continuous angle, velocity and acceleration, including interrupted transitions, and the normal 1× speed limit of 30 degrees/s. Retain 0.25–3× debug playback.
- Preserve AMT144 glyphs, long / short hands, rounded pivots, responsive Canvas, and single-file delivery.
- Keep routine time-to-time updates minimal and minute scheduling bounded.

## Proposed Solution

The `patterns` catalog owns the nine manually selectable displays and generates their controls. The separate `formations` catalog contains four straight axes: horizontal, vertical, and both diagonals. Score applies the selected axis uniformly to every clock, keeping complex display geometries out of the organizing route. Static selection ends at zero velocity and acceleration; a passage retains nonzero velocity without dwelling. A passage supplies all 288 endpoint states, including a nonzero common angular velocity and zero acceleration. The existing bounded connector reaches those states. For unrestricted routes it checks adjacent unwrapped angle equivalents when the shortest angular path would require costly reversals; explicit directions and turn counts remain authoritative. A conservative Bernstein hull can accept or reject a safe curve without fully subdividing regions already within the limit. Then the next connector begins at exactly the same states and timestamp. There is no hold segment or separate passage timer. The selected whole-screen geometry organizes typography before the spatial field begins.

Director owns scene categories (`text` and `pattern`) and the cached random formation choice. Only a `text` to `pattern` change inserts a passage. Pattern-to-text, pattern-to-pattern and text-to-text changes connect directly. Text input identifies its category explicitly rather than inspecting labels or guessing from angles. The first formation is drawn uniformly from the four choices. A committed outgoing text-to-pattern route replaces the cached draw with a uniformly chosen different successor. Direct routes, time-only fallbacks, failed plans, and minute-budget retries keep the cached draw. The random source is injectable for reproducible tests; Score never samples randomness. A scheduled minute performance includes one outgoing passage and a direct return to the clock in its precomputed duration; shorten the flow down to two seconds or use the existing time-only fallback if a late start cannot fit the complete bounded route. Tests cover every catalog sequence with each of the four formations starting at the usual six-second mark, preserving the outgoing passage and direct return.

## Implementation Plan

1. Separate the four uniform formation axes from the manual pattern catalog and generate their endpoint states in Score using the existing bounded connector.
2. Route only departures from time / text to patterns through passages in Director; return directly to time / text for both manual and automatic playback.
3. Cache a random formation until an outgoing route is committed, exclude it from the next draw, and preserve the choice through planning retries and interruptions.
4. Verify full-matrix geometry at the passage, nonzero speed before / at / after it, C2 joins, speed limits, all modes and manual destinations.
5. Inspect transitions in the local browser preview and update usage documentation. Deploy only when explicitly requested.

## Trade-offs & Risks

The formation lengthens departures from text to patterns; the return goes directly to the typography. Minute performances have less available flowing time and may fall back to a time update when started too late. The order varies between runs; injecting the same random stream reproduces it for tests. Immediate repeats are excluded, while nonconsecutive repeats remain possible. Rapidly replacing an in-progress route always starts from the sampled current motion; the source and destination categories determine whether the replacement route needs an outgoing organizing passage.

## Validation & Rollout

Keep existing speed, continuity, layout, minute, transport and interruption checks. Add focused behavioral checks for the nine resting manual displays and four flat organizing formations, passage velocity without any dwell, the outgoing-only passage rule, deterministic scheduling retries and bounded minute arrivals. Inspect representative clock-to-pattern passages and direct pattern-to-clock returns in the browser at 1× and debug speed. No dependencies, stored data or migrations are introduced.

Validation completed: 28 tests pass, including independent manual displays, four uniform passage axes, nonzero passage speed, matching letter-stroke motion, random selection and retry stability, category routing, all interrupted sequence pairs, all 76 minute sequence / formation combinations, and 3× debug playback. The core remains one inline script and the renderer retains the established long / short hand geometry.
