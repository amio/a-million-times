# A Million Times 144: research and implementation design

Status: implemented locally, with 28 automated checks and browser layout and interaction checks passing. Production URL: [amilliontimes.vercel.app](https://amilliontimes.vercel.app/). See [research and usage](../research.md).

## Context & Goals

Recreate the motion language of Humans since 1982's clock matrix as a directly openable HTML file: JavaScript drives Canvas, only the hands are drawn, and the complete matrix stays centered and scales with the viewport. The focus is glyphs, geometric patterns, and choreography, with deployment to Vercel.

Verified observations from the original:

- The [official product and mode description](https://www.humanssince1982.com/en-us/products/a-million-times-120-black) describes independent stepper motors, position calibration, and digital time. Active cycles through about 20 sequences in 20 minutes, returning to time each minute. Original repeats earlier choreography. Minimal moves only the hands needed for a time update.
- The [official technical account](https://www.humanssince1982.com/en-int/pages/savoir-faire) describes a modular motor, sensor, and microprocessor network, up to 30,000 messages prepared before a 60-second animation, and internal simulation and preview tools. The protocol, trajectories, glyphs, and interpolation algorithm are not public.
- The [studio's early demonstration](https://vimeo.com/60491636) alternates independent motion and collective formations, eventually forming numeric typography.
- Official AMT120 product photographs show 15 columns and eight rows. Equal-length hands pointing in opposite directions span a cell, and gradual angle differences between neighboring cells form waves.
- The [official AMT120 demonstration embedded in the product page](https://cdn.shopify.com/videos/c/vp/2a1a2d37452a4306a0f95211d7b3e436/2a1a2d37452a4306a0f95211d7b3e436.HD-1080p-7.2Mbps-32751872.mp4) lasts 43.37 seconds. Frames inspected at three-second intervals show 09:34 at zero; distorted glyphs and emerging concentric curves at 3–9 seconds; opening and closing hand pairs and radial phase propagation forming rings, arrows, and vortices at 12–36 seconds; and 09:35 forming near 39 seconds. Background nodes retain overlapping diagonal hands. Each digit occupies approximately 3 × 6 cells and forms a connected outline without fades.

The implementation uses AMT144 throughout: 18 columns, eight rows, 144 clocks, and 288 independent hands, matching the official AMT144 reference layout.

### Digit reference comparison

The [official AMT144 time photograph](https://cdn.shopify.com/s/files/1/0640/8241/1715/files/AmillionTimes144_Black_Hires_TIme1.jpg?v=1719522712) was compared with the complete 09:34 frame from the AMT120 video:

- AMT144 has an 18 × 8 matrix and four 3 × 6 digits. Digits are packed within each HH / MM pair. The central two columns use eight cells to form two square colon outlines.
- AMT120 uses a 15 × 8 matrix with the same 3 × 6 glyph size. The reference has one central parked diagonal column and no colon.
- The outer outline of 0 contains a four-row vertical slit, terminated at each end by two overlapping hands. The upper slit in 9 spans two rows. Digits 3 and 5 use folded orthogonal outlines rather than seven-segment centerlines.
- The implementation follows AMT144's packed layout, with a centered 14-column time area and two parked diagonal columns on each side.
- Hands have fixed lengths, rounded pivots, and flat tips. The initial photographic estimate was 0.40 cell pitches. The current long and short hands use 0.42 and 0.38 pitches, with a width of about 0.077 pitches and a gap between neighboring tips. These are this implementation's visual proportions, not official mechanical dimensions.
- Digits 0, 3, 4, 5, and 9 have direct cell-level evidence in the references. Digits 1, 2, 6, 7, and 8 follow the same outline grammar. The alphabet extends this implementation's glyph library and is not claimed to reproduce the original letter by letter.

## Requirements & Invariants

- One HTML file, no runtime dependencies, Canvas rendering, fixed centers, and two fixed-length hands always present at each center.
- Patterns consist of hand angles. Hiding, fading, or shortening hands cannot substitute for a glyph.
- Characters and patterns connect smoothly using continuous angles across zero, independent directions, and full turns. Several full-matrix organizing formations are available as moving passages; normal transitions stay slow.
- Resizing changes projection only, never the active motion.
- Display real local time while keeping artistic time and wall time separate.
- Use English copy and the title A Million Times 144, with 144 in a muted color. Hide controls and playback information initially; ⌘K / Ctrl+K toggles them. Group playback information and transport at the bottom left, with the Controls button at the bottom right. About at the top right provides an introduction and source link.

## Proposed Solution

The application lives in one inline script with clear owners:

1. **Pattern** owns angles. Glyphs encode strokes between nodes, with at most two rays per node. Unused nodes keep overlapping diagonal hands. Mathematical patterns return a two-angle field. The `patterns` catalog owns nine manual display geometries, labels, and IDs. The independent `formations` catalog limits organizing passages to four uniform straight-line axes.
2. **Score / Segment** owns trajectories and motion bounds. Each hand keeps unwrapped angle, angular velocity, and angular acceleration. Continuous fields and static poses use the same connector, which lengthens transitions according to whole-curve derivative bounds to stay within 30 degrees per second at 1×.
3. **Director** owns choreography, playback state, and minute scheduling. Only time/text departures to patterns pass through randomly chosen organizing formations with nonzero velocity and no dwell. The next formation is cached until a departure is committed, then replaced by a different random choice. Returns to time/text connect directly. Minute modes plan the complete safe route, including departure organization and direct return, before choosing flow duration and departure time. No trajectory is compressed to catch a deadline. Exhibition holds the returned time for six artistic seconds.
4. **Transport** owns the animation clock, pause, playback rate, and background recovery. requestAnimationFrame samples absolute time without accumulated per-frame chasing error.
5. **Renderer** projects fixed-length hands onto a single Canvas and adapts the scale and device pixel ratio to the viewport.
6. **Interface** owns toolbar visibility and two mutually exclusive panels. Hidden controls leave both the visual layout and keyboard tab order. Keyboard commands are handled before editable-field guards where appropriate, and closing a panel returns focus to its trigger. The debugging toolbar has no visible entry in the default view.

The sequence catalog currently has 19 entries. UI numbering and iteration derive their count from that catalog. Weave repeats a four-clock loop with one shared opening wave. Its column offset leaves half loops along the side edges; quarter-turn symmetry keeps squares, small rings, and diamonds aligned throughout the motion. Checkerboard keeps four-clock tiles coherent with quarter-turn symmetry. Neighboring tiles alternate between open and compact shapes; quarter-cycle separation between their opening and turning waves preserves contrast through intermediate poses. Bounded row and column phase offsets vary the four spatial groups while retaining the board.

Trajectory endpoints specify position, velocity, and acceleration for C2 continuity. Interrupted routes start from the current sampled state. Short acceleration ramps preserve velocity without first stopping the hands. Angles wrap only for comparisons; the running state preserves full turns. Playback retains 0.25–3×, with rates above 1× labeled Debug. See [continuous transition design](continuous-transitions.md) for speed bounds and [moving formation passages](orderly-passages.md) for current routing.

## Implementation Plan

1. Inspect public demonstrations and record local poses, waves, and timing.
2. Build DOM-independent Pattern, Track, and Score logic, validating glyphs and trajectory continuity first.
3. Author motion families: synchronized sweeps, row and column waves, counter-rotation, radial fields, vortices, diagonal and diamond patterns, checkerboards, fans, convergence, and time returns. Extend them through parameters and stages.
4. Connect a minimal Canvas, hidden controls, transport, speed, sequence selection, text, real time, and responsive projection.
5. Verify numerical bounds, every glyph, complete playback, interruptions, pause, speed, minute boundaries, and viewport behavior.
6. Deploy the final index.html to Vercel and verify the public result. Keep implemented designs under docs/implemented and research notes in docs/research.md.

## Trade-offs & Risks

- The implementation reconstructs observable motion language, not the original 20 proprietary trajectories. Limited footage cannot establish every stage of an original sequence.
- A two-hand node can express at most two directions, requiring a custom outline glyph library. Treating cells as ordinary lit pixels loses the original line semantics.
- Every target angle has multiple equivalent routes. Short routes suit time updates; choreography requires deliberate direction and winding choices to avoid unstructured rotation.
- Small screens naturally make the matrix smaller. Preserving the complete matrix and its proportions takes priority, while controls remain usable.
- Mechanical stepping, backlash, and sound are outside this visual simulation.

## Validation & Rollout

Node checks exercise endpoint and derivative continuity, zero crossings, directions and full turns, interruption continuity, finite states for all 288 hands, glyph limits, and 12/24-hour conversion. Browser checks cover Canvas, controls, keyboard and focus behavior, centering, portrait and landscape layouts, and English feedback. This static file has no database or data migration. Deploy only the HTML; a saved previous HTML can be redeployed to roll back.
