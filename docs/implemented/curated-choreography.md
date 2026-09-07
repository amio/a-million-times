# Choreography Selection and Visual Distinction

Status: implemented. This document records the independent-study selection. In a subsequent review, the user removed Off-canvas focal wave; the current catalog contains eight references and seven studies. The remaining reference reconstructions are preserved.

## Context & Goals

Before this selection, the animated catalog contained nine reference reconstructions and 19 independent studies. Several radial studies differed mainly in radius or phase and were difficult to distinguish while watching. The selection applies only to the independent collection: retain seven studies and make Weave a static pattern. All nine official-reference reconstructions remain, for a total of 16 animated entries. The user's reference to Column swap corresponds to the existing Column sweep.

## Requirements & Invariants

- Preserve the main trajectories of Counter-rotation, Column sweep, Checkerboard, and Twin vortices.
- Improve Mirrored vortex; retain two of the four radial candidates and strengthen their distinction.
- Remove Weave from animated playback while keeping it available as a static pattern; remove the remaining independent studies.
- Preserve all nine official-reference reconstructions, source images, evidence levels, cue frames, and existing collection playback behavior.
- Preserve fixed centers and hand lengths, speed and acceleration bounds, C2 continuity, and minute scheduling.

## Proposed Solution

Each entry in `repertoire` owns its stable ID, name, angular field, inspection notes, and cue times. Director and the study view read the same catalog, composed of the `references` and `studies` collections. Only unused independent fields are removed. Reference reconstructions retain their complete motion, imagery, evidence notes, and playback links.

| Entry | Treatment and visual invariant |
|---|---|
| Counter-rotation / Column sweep / Checkerboard / Twin vortices | Preserve the existing angular fields |
| Mirrored vortex | One central focus; complete left and right fields mirror each other; hand pairs stay straight while the halves rotate oppositely at constant speed |
| Concentric breathing | Circular directions with one shared opening angle; the whole matrix contracts and expands together, with no radial delay |
| Diamond ripples | Fixed diagonal directions in four quadrants; Manhattan distance drives outward propagation along diamond-shaped phase contours |
| Weave (static) | Hold the former animation's initial 135° opening; repeat groups of four clocks with half groups at both edges |

Exhibition loops within the selected collection. Active uses the nine reference reconstructions; Original uses the reference Radial release. The study view retains both groups, pause, continuous scrubbing, and cue poses. It distinguishes reference evidence from descriptions of the independent studies.

## Implementation Plan

1. Refine the independent catalog, replace the three fields selected for improvement, and freeze Weave.
2. Retain the nine references and seven independent studies in the study view, including official imagery and sources.
3. Update documentation and tests; verify key forms, actual playback, manual static patterns, and transitions.

## Trade-offs & Risks

Synchronized opening makes Concentric breathing calmer than the former radial wave, establishing a timing contrast with Diamond ripples. Mirrored vortex preserves each hand's identity under reflection, so long and short hands mirror along with the complete field. Reference reconstructions are outside the selection scope; deletion rules for independent studies must not apply to them.

## Validation & Rollout

Numerically verify retained trajectories, reflection, straight hand pairs and opposing velocities, synchronized breathing, diamond phase contours and propagation, and persistent static Weave. Reuse trajectory-bound, interruption, and minute-arrival checks. In the browser, inspect forms at different phases, selection across both groups, source images and cue frames, the Weave control, and pause/resume. Preview locally.

Per-hand sampling against the previous angular fields confirmed that the four explicitly retained studies are identical. The nine restored references match their earlier motion and metadata, while the seven selected studies and static Weave retain their changes. The study view identifies static Weave and hides the animated timeline.

Full regression: 39 Node tests passed, covering all 16 sequences, both collection loops, the official photograph fit, source asset availability, and minute scheduling. Browser checks verified source images, cue frames, group switching, and numbering within each group.
