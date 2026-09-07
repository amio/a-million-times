> Current catalog: eight official-reference reconstructions plus [seven selected independent choreographies](implemented/curated-choreography.md), all available in the [interactive study](../index.html?study=1). See the [design guide](choreography-design-guide.md) and [source inventory](reference/official/catalog.md) for official visual evidence.

# A Million Times 144

Live: [amilliontimes.vercel.app](https://amilliontimes.vercel.app/)

An offline-capable [single-file Canvas implementation](../index.html): 18 columns, eight rows, 144 fixed centers, and 288 independent hands. Every image is formed by pairs of fixed-length hands, without clock faces, images, external fonts, or runtime dependencies.

## How the original digits work

A clock cell is a pair of rays from a shared center, rather than an on/off pixel. Opposite directions make a straight stroke, perpendicular directions make a corner, and overlapping hands make a half-stroke. Adjacent cells connect these strokes into outlines. Background cells keep both hands, overlapping at a diagonal around 7:30.

The glyphs were compared cell by cell with the [official AMT144 09:35 photograph](https://cdn.shopify.com/s/files/1/0640/8241/1715/files/AmillionTimes144_Black_Hires_TIme1.jpg?v=1719522712) and the 09:34 and 09:35 frames of the [official AMT120 demonstration](https://cdn.shopify.com/videos/c/vp/2a1a2d37452a4306a0f95211d7b3e436/2a1a2d37452a4306a0f95211d7b3e436.HD-1080p-7.2Mbps-32751872.mp4). Counting the cells gives:

| Property | AMT120 reference | AMT144 reference | This implementation |
|---|---|---|---|
| Matrix | 15 × 8 | 18 × 8 | 18 × 8 |
| Individual digit | 3 × 6 | 3 × 6 | 3 × 6 |
| Each hours/minutes pair | Two packed digits | Two packed digits | Two packed digits |
| Central separator | One parked diagonal column | Two columns forming a square colon | AMT144 colon |
| Outer margin | One column per side | Two columns per side | Two columns per side |

The AMT144 colon consists of two 2 × 2 square outlines, using **eight two-hand cells**. The four-digit time therefore occupies 14 columns and six rows, centered in the 18 × 8 matrix. The digits begin at columns 2, 5, 10, and 13 and row 1, using zero-based indices.

The outer outline of **0** contains a narrow vertical slit; **9** has a shorter slit in its upper half. Overlapping hands terminate each slit without making a hand disappear. **3 and 5** use folded orthogonal outlines rather than conventional seven-segment centerlines. The cell encoding for 0 is shown below; `v` and `^` mean two overlapping hands pointing down and up:

```text
┌ - ┐
│ v │
│ │ │
│ │ │
│ ^ │
└ - ┘
```

Digits 0, 3, 4, 5, and 9 have cell-level evidence in the references above. Digits 1, 2, 6, 7, and 8 follow the same outline grammar; A–Z are additional glyphs designed for this implementation. The AMT144 layout keeps two background columns on either side of the time. The original equal-length estimate was 0.40 cell pitches, with a width of about 0.077 pitches. The current design uses one long hand at 0.42 pitches and one short hand at 0.38 pitches: 5% longer and shorter respectively. Each hand keeps its length during motion. These are visual proportions inferred for this implementation, not official mechanical dimensions.

## Observed motion and inferred internal design

In the AMT120 video, rotation pulls the time outlines apart into concentric curves. The angle between each pair of hands then opens and closes while spatial phase differences propagate ripples, radial arrows, and vortices through the matrix. Hands finally settle in groups to restore the time. An [additional official AMT144 demonstration](https://cdn.shopify.com/videos/c/vp/ab5cc7720a4c4034823baf8359c2b619/ab5cc7720a4c4034823baf8359c2b619.HD-1080p-7.2Mbps-30993239.mp4) shows row and column propagation, folding fans, and returns to time. Motion is organized across the whole matrix rather than by random independent angles.

The [official product description](https://www.humanssince1982.com/en-us/products/a-million-times-120-black) describes independent motors, calibration, and three modes. Active cycles through approximately 20 sequences over 20 minutes and displays the time every minute. Original repeats the early choreography. Minimal moves only the hands needed to update the time.

The [official technical account](https://www.humanssince1982.com/en-int/pages/savoir-faire) describes motor, sensor, and microprocessor modules, internal simulation tools, and up to 30,000 messages prepared before a 60-second animation. This supports the inference that individual hand movements are planned ahead and executed against a shared time reference. The original communication protocol, glyph data, trajectories, and interpolation algorithm have not been published. The model below belongs to this implementation; these inferences are not claims about the original source code.

## Motion model

- **Pattern** supplies the two target angles for each cell. Characters use the ray-based glyph library. The `patterns` catalog owns the nine manual displays. A separate `formations` catalog restricts organizing passages to four uniform straight-line axes.
- **Score / Segment** stores unwrapped angle, angular velocity, and angular acceleration for every hand. A common connector joins the current and target states, calculating enough time to respect speed and acceleration bounds over the whole curve. Angles never wrap back into 0–360 degrees during motion, so crossing zero, forced directions, and full turns remain continuous.
- **Director** manages selection, flow, returns, holds, and minute scheduling around the computed safe durations. Interruptions continue from the current position, velocity, and acceleration. Only departures from time or text to patterns pass through one of four dedicated organizing formations, chosen randomly without immediate repetition. Patterns return directly to time or text, gathering into the destination typography. Pattern-to-pattern and text-to-text transitions also connect directly.
- **Playback clock** separates real time from artistic time. Rate changes follow a continuous curve integrated over time, preserving results across frame rates. Returning from the background resets the frame delta and realigns the time according to the mode.
- **Renderer** projects fixed centers and current angles onto Canvas. Resizing changes only the projection and pixel density, never a trajectory.

At 1×, the whole transition curve is bounded by **30 degrees per second**; authored angular acceleration is bounded by 15 degrees per second squared. Short ramps bring the existing acceleration smoothly to zero while retaining velocity, followed by a quintic Hermite connector. Derivatives are converted to Bernstein control values; subdivided convex hulls bound the entire curve's peaks. A transition that exceeds a bound is lengthened. This includes peaks between rendered frames, not just average speed. The speed control scales the complete timeline, so debugging rates proportionally increase physical speed.

An organizing formation is a moving waypoint. All 288 hands reach it with a shared angular speed of approximately eight degrees per second. The next segment begins at the same position, velocity, and acceleration with no dwell. Typography first gathers into a whole-matrix geometry and then unfolds into a spatial pattern. Manual static patterns have zero target velocity and acceleration and hold their pose. Their catalog is independent of the organizing formations, so adding or changing a display pattern cannot affect automatic transitions.

The Static patterns catalog contains nine manually selected displays: Diagonals, Corners, Alternating, Rings, Diamond, Wave, Weave, Fan, and Parallel. Organizing passages have their own four formations: Horizontal, Vertical, Falling diagonal, and Rising diagonal. Every clock shares the same straight axis, making the whole matrix orderly. Director caches the next random choice until a departure is committed and then draws a different successor; planning retries and direct routes reuse the cached choice.

Routing accounts for existing motion. If the shortest angular route would first require a reversal, the planner checks adjacent full-turn equivalents and chooses a smooth route under the same bounds. This choice is available only when no direction or turn count was explicitly requested. The planner never compresses a trajectory to meet a deadline.

Continuous patterns are spatial phase fields: angles depend on row, column, distance from the center, direction, and time. Diamond ripples uses Manhattan distance as phase; Concentric breathing shares one opening across Euclidean rings; counter-rotation moves a cell's two hands in opposite directions. Fields compile into the same trajectory format as characters and static patterns, so all use the same transition logic.

The default collection contains eight official-reference reconstructions. The separate Independent studies collection contains seven selected sequences: Counter-rotation, Column sweep, Checkerboard, Twin vortices, Mirrored vortex, Concentric breathing, and Diamond ripples. The seven studies are independently authored; **they are not recovered copies of the original 20 proprietary trajectories**. Mirrored vortex uses one central focus and reflects each straight pair across the vertical axis; opposite halves rotate in opposite directions. Concentric breathing changes its opening globally, while Diamond ripples carries folds outward along diamond-shaped shells.

Weave is a static pattern. It repeats the former animated four-clock loop at its initial 135° opening. A one-column offset leaves half loops at both side edges. It settles through the same bounded transition as the other manual displays, then stays still until another action. It is absent from sequence selection and automatic playback.

Checkerboard uses a 9 × 4 board of tiles, each formed by four clocks with quarter-turn symmetry. Neighboring tiles exchange compact knots, open frames, and opposing folded corners. Opening and turning contrast are a quarter cycle apart: when the opening difference fades, the orientation difference grows. Bounded row and column phase offsets create four evolving rhythmic groups without dissolving the alternating board. These continuous, deterministic fields preserve motion through every pose; the 24-second Checkerboard flow stays below 17 degrees per second at 1×.

## Usage

The default is continuous Exhibition mode. Each sequence returns to local time, holds it for six seconds at 1×, and begins the next sequence. Playback speed also scales that hold.

Controls and playback information are hidden debugging tools with no visible entry on load. Press **⌘K** or **Ctrl+K**, or double-click the canvas, to reveal them. Playback information and Time / Pause / Next are grouped at the bottom left. The bottom-right Controls button opens the settings panel. About stays available at the top right with a brief introduction and a [View source link](https://github.com/amio/a-million-times).

| Control | Behavior |
|---|---|
| Exhibition | Continuous choreography, returning to time between sequences |
| Active | Rotates through the eight references on real minutes and returns at each minute boundary |
| Original | Repeats the reference Radial release on real minutes |
| Speed | 0.25–1× for slow and normal playback; above 1× is labeled Debug, up to 3× |
| Minimal | Displays time and changes only the necessary hands |
| Text | 1–4 letters A–Z, digits, spaces, or hyphens; four digits use the clock layout and colon |
| Space | Pause / resume |
| → | Next sequence |
| T | Return to time |
| ⌘K / Ctrl+K or a canvas double-click | Show / hide controls and playback information |
| Escape | Close an open panel, otherwise hide the toolbar |

Active and Original follow real minutes at 1×, with the speed control disabled. Mode changes return smoothly to 1×. After returning on a minute boundary, they use a six-second base wait. Before departure, the planner computes the complete entry, flow, and direct return, including one outgoing organizing formation. It shortens the flow if necessary, down to two seconds. If a late start cannot fit a complete bounded sequence, the minute contains only a time update. Any spare time becomes an additional hold on the current clock before departure; transitions are never compressed to catch the minute.

Minimal plans the necessary hand changes ahead of each minute. If pause or background recovery happens too late, it finishes at a safe speed. Manual returns from Exhibition also calculate arrival time before choosing the digits. Selecting a sequence starts Exhibition mode. Manual text and static patterns hold until another playback or time command. A system preference for reduced motion selects Minimal by default.

## Validation

Automated checks cover the AMT144 layout and glyphs, crossing zero and full turns, pause recovery, frame-rate independence, time formatting, whole-polynomial peak bounds, every interrupted pair across all 15 sequences, official reference geometry and image availability, static Weave loops, Checkerboard tile symmetry and contrast, mirrored counterflow, synchronized breathing, diamond propagation, every manual target, minute changes, and arrival prediction at different playback speeds. All 15 sequences preserve position, velocity, and acceleration at joins. Normal playback and rapid operations remain within 30 degrees per second; 3× debugging remains available.

Formation checks cover four uniform straight axes across the complete matrix, nonzero waypoint velocity, matching motion for repeated letter strokes, outgoing-only passages, random selection without consecutive repeats, stable choices through planning retries, and direct time returns after interruption. All eight reference minute sequences are checked with each of the four formations. The nine static patterns remain independently selectable resting displays.

Browser checks cover the default hidden toolbar, ⌘K / Ctrl+K, input focus and validation, panel dismissal, About and its source link, and desktop, portrait, and landscape layout. The single file opens directly or can be served by a static server or Vercel.
