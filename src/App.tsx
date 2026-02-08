import { memo, useEffect, useRef, useState } from 'react'
import './App.css'

const ROWS = 8
const COLS = 15
const TAU = Math.PI * 2

type ClockState = [number, number]
type GridState = ClockState[][]

type PatternFn = (row: number, col: number) => ClockState

type PatternFactory = (time: { now: number; wallTime: number }) => PatternFn

type EasingFn = (t: number) => number

type StaggerFn = (row: number, col: number) => number

interface Scene {
  pattern: PatternFactory
  duration: number
  hold: number
  easing: EasingFn
  stagger: StaggerFn
  continuous?: boolean
  follow?: number
}

interface RuntimeState {
  from: GridState
  to: GridState
  startTime: number
  duration: number
  easing: EasingFn
  stagger: StaggerFn
  staggerMax: number
}

const U = 0
const R = Math.PI / 2
const D = Math.PI
const L = (3 * Math.PI) / 2

const H: ClockState = [R, L]
const V: ClockState = [U, D]
const O: ClockState = [U, U]

const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const easeInOutQuad: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

const easeOutBack: EasingFn = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const stagger = {
  none: () => 0,
  leftToRight: (_row: number, col: number) => col * 80,
  radial: (row: number, col: number) => {
    const cx = (COLS - 1) / 2
    const cy = (ROWS - 1) / 2
    return Math.hypot(col - cx, row - cy) * 100
  },
  diagonal: (row: number, col: number) => (row + col) * 60,
  random: (row: number, col: number) =>
    pseudoRandom(row * COLS + col) * 500,
}

const makeGlyph = (rows: string[]): ClockState[][] =>
  rows.map((row) =>
    row.split('').map((cell) => {
      if (cell === 'H') return H
      if (cell === 'V') return V
      return O
    })
  )

const DIGIT_GLYPHS: Record<number, ClockState[][]> = {
  0: makeGlyph(['HHH', 'V.V', '...', 'V.V', 'HHH']),
  1: makeGlyph(['..V', '..V', '..V', '..V', '..V']),
  2: makeGlyph(['HHH', '..V', 'HHH', 'V..', 'HHH']),
  3: makeGlyph(['HHH', '..V', 'HHH', '..V', 'HHH']),
  4: makeGlyph(['...', 'V.V', 'HHH', '..V', '..V']),
  5: makeGlyph(['HHH', 'V..', 'HHH', '..V', 'HHH']),
  6: makeGlyph(['HHH', 'V..', 'HHH', 'V.V', 'HHH']),
  7: makeGlyph(['HHH', '..V', '..V', '..V', '..V']),
  8: makeGlyph(['HHH', 'V.V', 'HHH', 'V.V', 'HHH']),
  9: makeGlyph(['HHH', 'V.V', 'HHH', '..V', 'HHH']),
}

const timePatternFactory: PatternFactory = (time) => {
  const date = new Date(time.wallTime)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const digits = [
    Math.floor(hours / 10),
    hours % 10,
    Math.floor(minutes / 10),
    minutes % 10,
  ]
  const glyphs = digits.map((digit) => DIGIT_GLYPHS[digit])
  const startRow = Math.floor((ROWS - 5) / 2)
  const digitWidth = 3
  const gap = 1
  const totalWidth = digitWidth * 4 + gap
  const startCol = Math.floor((COLS - totalWidth) / 2)

  return (row, col) => {
    if (row < startRow || row >= startRow + 5) return O
    const localCol = col - startCol
    if (localCol < 0 || localCol >= totalWidth) return O
    if (localCol >= digitWidth * 2 && localCol < digitWidth * 2 + gap) {
      return O
    }
    const adjustedCol =
      localCol > digitWidth * 2 ? localCol - gap : localCol
    const digitIndex = Math.floor(adjustedCol / digitWidth)
    if (digitIndex < 0 || digitIndex > 3) return O
    const glyph = glyphs[digitIndex]
    return glyph[row - startRow][adjustedCol % digitWidth]
  }
}

const wavePatternFactory: PatternFactory = (time) => {
  const phase = (time.now * 0.001) % TAU
  return (row, col) => {
    const angle = ((col + row * 0.3) / COLS) * TAU + phase
    return [angle, angle + Math.PI]
  }
}

const vortexPatternFactory: PatternFactory = (time) => {
  const phase = (time.now * 0.0009) % TAU
  const cx = (COLS - 1) / 2
  const cy = (ROWS - 1) / 2
  return (row, col) => {
    const dx = col - cx
    const dy = row - cy
    const dist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx) + dist * 0.6 + phase
    return [angle, angle + Math.PI]
  }
}

const uniformPatternFactory = (angle: number): PatternFactory =>
  () => () => [angle, angle + Math.PI]

const randomPatternFactory = (seed: number): PatternFactory =>
  () => (row, col) => {
    const base = seed + row * COLS + col * 13
    const first = pseudoRandom(base) * TAU
    const second = pseudoRandom(base + 77.7) * TAU
    return [first, second]
  }

const SCENES: Scene[] = [
  {
    pattern: timePatternFactory,
    duration: 2000,
    hold: 5000,
    easing: easeInOutCubic,
    stagger: stagger.radial,
  },
  {
    pattern: wavePatternFactory,
    duration: 1500,
    hold: 4000,
    easing: easeInOutQuad,
    stagger: stagger.leftToRight,
    continuous: true,
    follow: 900,
  },
  {
    pattern: vortexPatternFactory,
    duration: 2000,
    hold: 4000,
    easing: easeInOutCubic,
    stagger: stagger.radial,
    continuous: true,
    follow: 900,
  },
  {
    pattern: uniformPatternFactory(0),
    duration: 1000,
    hold: 2000,
    easing: easeOutBack,
    stagger: stagger.diagonal,
  },
  {
    pattern: randomPatternFactory(42),
    duration: 1500,
    hold: 2000,
    easing: easeInOutCubic,
    stagger: stagger.random,
  },
]

const buildGrid = (pattern: PatternFn): GridState =>
  Array.from({ length: ROWS }, (_row, r) =>
    Array.from({ length: COLS }, (_col, c) => pattern(r, c))
  )

const wrapDiff = (diff: number) =>
  ((diff + Math.PI) % TAU + TAU) % TAU - Math.PI

const lerpAngle = (from: number, to: number, t: number) =>
  from + wrapDiff(to - from) * t

const angleDistance = (from: number, to: number) =>
  Math.abs(wrapDiff(to - from))

const interpolate = (state: RuntimeState, now: number): GridState =>
  state.from.map((row, r) =>
    row.map(([a0, b0], c) => {
      const delay = state.stagger(r, c)
      const elapsed = Math.max(0, now - state.startTime - delay)
      const t = state.duration === 0 ? 1 : Math.min(1, elapsed / state.duration)
      const eased = state.easing(t)
      const [a1, b1] = state.to[r][c]
      return [lerpAngle(a0, a1, eased), lerpAngle(b0, b1, eased)]
    })
  )

const followGrid = (
  current: GridState,
  target: GridState,
  dt: number,
  follow: number
): GridState => {
  if (dt <= 0) return current
  const alpha = follow <= 0 ? 1 : 1 - Math.exp(-dt / follow)
  return current.map((row, r) =>
    row.map(([a0, b0], c) => {
      const [a1, b1] = target[r][c]
      return [lerpAngle(a0, a1, alpha), lerpAngle(b0, b1, alpha)]
    })
  )
}

const pseudoRandom = (seed: number) => {
  let x = (seed * 0x9e3779b9) | 0
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return (x >>> 0) / 4294967296
}

class SequenceEngine {
  private scenes: Scene[]
  private sceneIndex = 0
  private sceneStart = 0
  private state: RuntimeState | null = null
  private current: GridState | null = null
  private lastTime = 0

  constructor(scenes: Scene[]) {
    this.scenes = scenes
  }

  private computeStaggerMax(staggerFn: StaggerFn) {
    let max = 0
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        max = Math.max(max, staggerFn(r, c))
      }
    }
    return max
  }

  private enterScene(
    index: number,
    now: number,
    wallTime: number,
    from: GridState
  ) {
    const scene = this.scenes[index]
    const target = buildGrid(scene.pattern({ now, wallTime }))
    this.sceneIndex = index
    this.sceneStart = now
    this.state = {
      from,
      to: target,
      startTime: now,
      duration: scene.duration,
      easing: scene.easing,
      stagger: scene.stagger,
      staggerMax: this.computeStaggerMax(scene.stagger),
    }
    this.current = from
  }

  compute(now: number): GridState {
    const wallTime = Date.now()
    if (!this.state || !this.current) {
      const initialPattern = randomPatternFactory(7)({ now, wallTime })
      const initialGrid = buildGrid(initialPattern)
      this.enterScene(0, now, wallTime, initialGrid)
      this.lastTime = now
      return initialGrid
    }

    const scene = this.scenes[this.sceneIndex]
    const elapsed = now - this.sceneStart
    const transitionEnd = this.state.staggerMax + this.state.duration
    const dt = this.lastTime ? now - this.lastTime : 0
    this.lastTime = now

    let current: GridState
    if (elapsed < transitionEnd) {
      current = interpolate(this.state, now)
    } else if (scene.continuous) {
      const target = buildGrid(scene.pattern({ now, wallTime }))
      current = followGrid(this.current, target, dt, scene.follow ?? 800)
    } else {
      current = this.state.to
    }

    this.current = current

    if (elapsed >= transitionEnd + scene.hold) {
      const nextIndex = (this.sceneIndex + 1) % this.scenes.length
      this.enterScene(nextIndex, now, wallTime, current)
    }

    return current
  }
}

const Clock = memo(
  ({ a, b }: { a: number; b: number }) => (
    <svg className="clock-face" viewBox="-50 -50 100 100" aria-hidden="true">
      <circle className="clock-ring" r={45} />
      <line
        className="clock-hand"
        x1={0}
        y1={0}
        x2={Math.sin(a) * 35}
        y2={-Math.cos(a) * 35}
      />
      <line
        className="clock-hand"
        x1={0}
        y1={0}
        x2={Math.sin(b) * 35}
        y2={-Math.cos(b) * 35}
      />
      <circle className="clock-core" r={3} />
    </svg>
  ),
  (prev, next) =>
    angleDistance(prev.a, next.a) < 0.002 &&
    angleDistance(prev.b, next.b) < 0.002
)

const useClockGrid = () => {
  const engineRef = useRef(new SequenceEngine(SCENES))
  const [grid, setGrid] = useState<GridState>(() =>
    buildGrid(randomPatternFactory(3)({ now: 0, wallTime: Date.now() }))
  )

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const now = performance.now()
      setGrid(engineRef.current.compute(now))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return grid
}

function App() {
  const grid = useClockGrid()

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">A Million Times 120</p>
        <h1>240 hands, one living surface.</h1>
        <p className="lede">
          A procedural re-creation of 120 synchronized clocks. Patterns emerge by
          steering nothing but two angles per dial.
        </p>
        <div className="meta">
          <span>15 × 8 grid</span>
          <span>Sequence engine</span>
          <span>Real-time & procedural</span>
        </div>
      </header>

      <section className="grid-wrap" aria-label="Clock grid animation">
        <div className="clock-grid">
          {grid.map((row, r) =>
            row.map(([a, b], c) => <Clock key={`${r}-${c}`} a={a} b={b} />)
          )}
        </div>
      </section>
    </div>
  )
}

export default App
