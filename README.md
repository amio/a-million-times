# A Million Times 144

A kinetic Canvas clock with an 18 × 8 matrix, 144 clocks, and 288 hands. HTML, CSS, and JavaScript live in a single `index.html`, with no runtime dependencies.

[Live demo](https://amilliontimes.vercel.app/) · [Research and usage](docs/research.md) · [Implementation design](docs/implemented/clock-choreography.md) · [Source](https://github.com/amio/a-million-times)

At 1×, transitions stay within 30 degrees per second. Exhibition mode holds the time for six seconds between sequences. Nine static patterns are available for manual display. Departures from time or text use a separate set of four uniform straight-line formations, chosen randomly without immediate repeats; returns to time and text connect directly. Playback ranges from 0.25× slow motion to 3× debugging speed.

## Controls

Controls and playback information are hidden debugging tools, with no visible entry on load. Press **⌘K** on macOS or **Ctrl+K** elsewhere to toggle them. Double-clicking the canvas does the same. Playback information and Time / Pause / Next sit together at the bottom left; the Controls button at the bottom right opens the settings panel.

About, at the top right, introduces the work and links to the source. Space pauses or resumes, → selects the next sequence, and T returns to the time. Escape closes an open panel, or hides the toolbar when no panel is open.

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

The existing Vercel project is `amio/a-million-times-144`. Sign in to the corresponding account and run the following from a directory containing only `index.html`:

```sh
vercel deploy --prod --yes --project a-million-times-144 --scope amio
```

A browser recreation of Humans since 1982’s A Million Times, made as a tribute to the original work. This independent implementation uses no original software or media assets. The digits were reconstructed from official reference images; the 19 sequences are independently authored.
