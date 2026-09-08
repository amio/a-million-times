# A Million Times 144

A kinetic Canvas clock with an 18 × 8 matrix, 144 clocks, and 288 hands. HTML, CSS, and JavaScript live in a single `index.html`, with no runtime dependencies.

The matrix stays centered in its display area with equal top and bottom margins. Each edge leaves at least 8% of the corresponding display dimension; the four margin percentages total at least 50%. Opening Controls reserves space beside the matrix, or below it on phones; margins are measured within the remaining canvas area.

[Live demo](https://amilliontimes.vercel.app/) · [Design guide](docs/choreography-design-guide.md) · [Choreography study](index.html?study=1) · [Source inventory](docs/reference/official/catalog.md) · [Research and usage](docs/research.md) · [Implementation design](docs/implemented/clock-choreography.md) · [Source](https://github.com/amio/a-million-times)

At 1×, transitions stay within 30 degrees per second. Exhibition mode holds the time for six seconds between sequences. Eight official-reference reconstructions remain the default collection. A separate Independent studies collection contains seven selected sequences: Counter-rotation, Column sweep, Checkerboard, Twin vortices, Mirrored vortex, Concentric breathing, and Diamond ripples. Mirrored vortex reflects two counter-rotating halves; Concentric breathing opens all rings together; Diamond ripples propagates angular folds outward. Nine static patterns are available for manual display, including Weave frozen at its four-clock woven pose. Each collection loops within itself. Active cycles through the eight reference reconstructions; Original repeats Radial release. Playback ranges from 0.25× slow motion to 3× debugging speed.

Departures from time or text progress in one of six randomly chosen directions: top to bottom, bottom to top, left to right, right to left, center outward, or edges inward. Rows, columns, or concentric rings begin in order across a six-second spread at 1×. Each clock crosses one of four straight-line formation axes, chosen randomly without immediate repeats, and continues moving while the rest of the wave arrives. Returns to time and text connect directly. Minute modes budget the full departure and shorten the main motion when needed. [Directional departure design](docs/implemented/directional-departures.md)

## Controls

Controls and playback information are hidden debugging tools, with no visible entry on load. Press **⌘K** on macOS or **Ctrl+K** elsewhere to toggle them. Double-clicking the canvas does the same. Playback information and Time / Pause / Next sit together at the bottom left; the Controls button at the bottom right opens the settings panel.

About, at the top right, introduces the work and links to the source. Controls combines the sequence selector, motion rule, key-pose buttons, and expandable Rules & references. Drag the bottom progress bar to pause and inspect the main sequence; Resume continues from that exact position. After a static pattern, custom text, or a manual time display, Play restarts the selected choreography. Static displays and real-minute modes disable scrubbing. All eight reference reconstructions retain their official images, source links, evidence labels, and cue frames. Existing study links open the same Controls panel at a paused pose. The design guide also includes measurements and source inventories. Space pauses or resumes, → selects the next sequence, and T returns to the time. Escape closes an open panel, or hides the toolbar when no panel is open.

## Local preview

Open `index.html` directly in a browser, or start a static server in the project directory:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Then visit <http://127.0.0.1:8080>.

## Tests

Use the Node.js test runner; no dependencies need to be installed:

```sh
node --test tests/*.test.cjs
```

## Deployment

Routine changes are previewed locally. Deploy only when explicitly requested.

The existing Vercel project is `amio/a-million-times-144`. Sign in to the corresponding account and run the following from the project directory, including `docs/reference/official` so the research images and guide remain available:

```sh
vercel deploy --prod --yes --project a-million-times-144 --scope amio
```

A browser recreation of Humans since 1982’s A Million Times, made as a tribute to the original work. This independent implementation uses no original software. The study documentation contains attributed official reference images and video stills; the clock itself is rendered procedurally. The eight reference reconstructions distinguish continuous-video evidence, partial footage, and photograph-based motion inference. The seven Independent studies are separately authored. Neither collection claims to recover the studio’s complete private repertoire or exact trajectories.
