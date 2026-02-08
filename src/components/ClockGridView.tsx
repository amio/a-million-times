import { memo } from 'react'

export type ClockState = [number, number]
export type GridState = ClockState[][]

type ClockAngles = {
  /**
   * Angle for the shorter hand in "pi units".
   * Range: [0, 2) where 2 == 2π radians (a full rotation).
   * 0 points up (12 o'clock) and values increase clockwise.
   */
  a: number
  /**
   * Angle for the longer hand in "pi units".
   * Range: [0, 2) where 2 == 2π radians (a full rotation).
   * 0 points up (12 o'clock) and values increase clockwise.
   */
  b: number
}

/**
 * Render a single clock face with two hands.
 */
const SVGClock = ({a, b}: ClockAngles) => (
  <svg className="clock-face" viewBox="-50 -50 100 100" aria-hidden="true">
    <circle className="clock-ring" r={48} />
    <line
      className="clock-hand"
      x1={0}
      y1={0}
      x2={Math.sin(a * Math.PI) * 36}
      y2={-Math.cos(a * Math.PI) * 36}
    />
    <line
      className="clock-hand"
      x1={0}
      y1={0}
      x2={Math.sin(b * Math.PI) * 46}
      y2={-Math.cos(b * Math.PI) * 46}
    />
    <circle className="clock-core" r={3} />
  </svg>
)

// Memoized clock for avoiding tiny, visually irrelevant updates.
const Clock = memo(
  SVGClock,
  // Skip re-render if angle changes are visually negligible.
  (
    prev: ClockAngles,
    next: ClockAngles
  ) =>
    angleDistance(prev.a, next.a) < 0.002 / Math.PI &&
    angleDistance(prev.b, next.b) < 0.002 / Math.PI
)

// Absolute smallest distance between two angles in "pi units".
function angleDistance(
  /** Starting angle in "pi units". */
  from: number,
  /** Target angle in "pi units". */
  to: number
) {
  const diff = to - from

  // Full rotation in "pi units".
  const TAU = 2

  // Normalize to the shortest signed distance in range [-PI, PI].
  const wrapedDiff = ((diff + 1) % TAU + TAU) % TAU - 1

  return Math.abs(wrapedDiff)
}

type ClockGridViewProps = {
  /** Precomputed grid of angle pairs in "pi units". */
  grid: GridState
}

// Usage: render-only component. Provide a precomputed `grid` of angles.
// Example:
// <ClockGridView grid={grid} />
// The grid shape should be ROWS x COLS, each cell is [angleA, angleB] in "pi units".
export function ClockGridView({ grid }: ClockGridViewProps) {
  // Render a grid of clocks from precomputed angle pairs.
  return (
    <div className="clock-grid" aria-label="Clock grid animation">
      {grid.map((row, r) =>
        row.map(([a, b], c) => <Clock key={`${r}-${c}`} a={a} b={b} />)
      )}
    </div>
  )
}
