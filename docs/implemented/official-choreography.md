# Official Choreography Research and Reconstruction

Status: implemented. The research initially delivered nine reference reconstructions. Off-canvas focal wave was subsequently removed from playback after user review, leaving eight; its source imagery and measurements remain research material. The independent collection was subsequently refined through the [seven-study selection](curated-choreography.md). Research date: 2026-09-07.

## Context & Goals

The user requested research into official Humans since 1982 photographs, videos, and the YouTube channel; an explanation of why the forms and motion are clear and compelling; a design guide; and reconstructions of the distinct choreographies identifiable in those sources. At the start of this work, the project was a dependency-free, single-file Canvas implementation with a fixed 18 × 8 matrix, 19 independent motion studies, text and time displays, and continuous trajectory scheduling.

The work connects official evidence to playable visual rules. Public pages do not provide the complete private repertoire or trajectory files. Artwork counts, photograph counts, the advertised 20 programs, and the independently identified rules are therefore treated as separate measures.

## Requirements & Invariants

- Inspect both official photographs and videos, retaining sources, frame timestamps, and coverage status.
- Explain visual rules, viewing experience, sequence structure, and practical design methods in the guide.
- Implement identifiable rules while distinguishing continuous-video evidence, partial footage, and photographic inference.
- Keep two hands per clock with fixed centers and lengths; preserve the existing 144-clock layout, glyphs, manual displays, and motion studies.
- Preserve bounded, continuous trajectories, pause and selection behavior, real-minute timekeeping, and reduced-motion behavior.

## Proposed Solution

1. `ClockCore` owns the reference catalog and angular fields. Each entry supplies a stable ID, description, source links, and evidence level. The original 19 sequences belong to Independent studies. Playback starts in the reference collection and loops within the selected collection; the real-minute Active mode uses references.
2. Express the observed geometry with a small set of rules: parallel column and row waves, line phases around a focus outside the frame, radial opening, horizontal and oblique scissor waves, continuous four-clock lattices, repeated radial centers, and diagonal chevrons. Photographs establish spatial relationships; motion direction and speed are explicitly inferred.
3. Retain `Score` as the sole trajectory owner and `Director` as the scheduling owner. Reconstructions target visible relationships. Adaptation to 144 clocks, transition paths, and physical speed are project choices, not recovered official per-hand control code.
4. Open the study view through `?study=1` on the same page, using the existing runtime for interactive previews. Support sequence selection, timeline scrubbing, cue poses, and links to official evidence. The HTML remains directly usable without a build step or network dependency.
5. Store deduplicated source inventories, contact sheets, and representative timelines in the documentation. Keep complete videos in the research cache and the user-supplied material directory, outside the repository.

## Implementation Plan

Complete the source inventory, measurements, and diagrams; add reference entries and angular rules; integrate collection playback, timeline inspection, and parameterized previews; produce the study catalog and guide; run numerical and browser validation; then move this document into `docs/implemented/`.

## Trade-offs & Risks

- Visual reconstruction cannot establish the private interpolator, complete repertoire, mechanical speeds, or edited-out movement. The guide records those limits for each entry.
- Rules from 72-, 96-, 120-, and 288-clock works and the circular 61c are adapted to the 144-clock grid. This is not a pixel-level copy of their materials, counts, or outlines.
- Angles estimated from compressed imagery require documented sampling methods and error estimates to avoid false precision.
- Some YouTube seeks failed to buffer. Black frames and stale frames after pausing are not evidence.

## Validation & Rollout

Check the invariants and distinctions of all added rules. Use complete polynomial bounds to verify speed, acceleration, continuity, and interrupted transitions. Check collection loops, timeline inspection and resumption, and minute scheduling. In the browser, inspect actual Canvas forms, desktop and mobile study layouts, source links, and reduced-motion behavior. Preview locally; deployment requires a separate request.

## Implementation Result

The research stage delivered nine reference reconstructions, the original 19 independent studies, a study view with scrubbing and cue poses, and a design guide containing official photographs, video contact sheets, YouTube coverage status, and measurements. Its 35 Node tests passed, covering all 28 trajectories and their transitions, photographic direction fitting, inspection and resumption, collection loops, and minute scheduling. Browser checks covered desktop and 390 px mobile layouts. The photograph model's RMS error was 0.814°. No deployment was performed.
