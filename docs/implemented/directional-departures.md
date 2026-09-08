# Directional departures from typography

## Context & Goals

Time and text currently leave through a randomly chosen straight-line formation, with all clocks moving together. The requested change is a spatially progressive departure, randomly chosen from top to bottom, bottom to top, left to right, right to left, center outward, and edges inward.

## Requirements & Invariants

- Apply the six directional choices to departures from typography to patterns.
- Preserve continuous position, velocity, and acceleration, including interrupted transitions, and the existing 1× speed and acceleration limits.
- Preserve bounded minute scheduling, static pattern destinations, and the existing repertoire.

## Proposed Solution

The spatial sweep catalog maps each cell to a normalized delay. Rows and columns share delays in linear sweeps; equal physical radii share delays in radial sweeps. A six-second spread at 1× makes the progression visible across the matrix. This duration and the circular radial geometry are implementation choices.

Director caches the randomly selected sweep alongside its existing formation choice. Planning retries reuse both; only a committed departure draws successors. Formation selection retains its existing exclusion of immediate repeats. Each sweep is selected uniformly from all six choices.

Score extends its bounded connector with per-cell delays for passage targets. Initial acceleration settles through the existing continuous ramp, then each hand waits at rest or continues its inherited velocity until its connector starts. Each connector retains its complete bounded travel duration. After crossing the formation, early hands continue at the passage's constant velocity until the last clocks arrive. This creates a moving gradient without a synchronized whole-screen formation or an intermediate stop. The next connector starts from those actual states. All tracks still end at the same score time; the Canvas remains a projection.

The delay option requires zero acceleration at its destination because early arrivals continue at constant velocity. Formation marks identify the earliest crossing and record the sweep; individual crossing times add the cell's delay.

## Implementation Plan

1. Add the six spatial delay functions and a shared spread duration.
2. Extend the existing connector to preserve endpoint motion around delays and account for the full spread in its duration.
3. Route automatic, manual, and scheduled text-to-pattern departures through the cached sweep.
4. Add regression checks for spatial order, preserved motion, random retry behavior, interruption, and minute arrivals; inspect local playback and update usage documentation.

## Trade-offs & Risks

Departures take six additional artistic seconds. Minute modes may shorten their pattern's main motion or use their existing clock-only fallback for late starts. Circular inward sweeps reach rectangular corners before nearer parts of the perimeter. When a departure interrupts moving text, delayed hands retain their incoming velocity instead of freezing abruptly.

## Validation & Rollout

Check all six directional orders and matching delays within each group. Check per-cell passage geometry, C2 joins, whole-polynomial motion bounds, interrupted text returns, and complete scheduled arrivals. Run the existing test suite and inspect representative departures through the local browser. No dependencies or persistent data change.

Validation: all 39 tests pass, including all 24 sweep/formation pairings, each of the eight minute sequences with all six sweeps, random-choice stability across retries and clock-only fallbacks, and continuity when either a departure or moving text is interrupted. Browser checks of vertical, horizontal, and outward departures show the leading region changing while the trailing typography remains visible; normal playback resumes without console errors.
