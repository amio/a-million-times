import { useEffect, useRef, useState } from 'react'
import { ClockGridView, type ClockState, type GridState } from './ClockGridView'
import { GLYPHS } from './glyphs'

const ROWS = 8
const COLS = 18
// Full rotation in "pi units" where 2 == 2π radians.
const TAU = 2
const SPEED = 0.4
const scaleMs = (ms: number) => Math.round(ms / SPEED)

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

const NE: ClockState = [0.25, 0.25]

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

type GlyphDefinition = (typeof GLYPHS)[keyof typeof GLYPHS]

const toGrid = (glyph: GlyphDefinition): ClockState[][] => {
  const rows: ClockState[][] = []
  for (let r = 0; r < glyph.rows; r += 1) {
    const start = r * glyph.cols
    rows.push(glyph.clocks.slice(start, start + glyph.cols))
  }
  return rows
}

const timePatternFactory: PatternFactory = (time) => {
  const date = new Date(time.wallTime)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const glyphs = [
    toGrid(GLYPHS[String(Math.floor(hours / 10))]),
    toGrid(GLYPHS[String(hours % 10)]),
    toGrid(GLYPHS[':']),
    toGrid(GLYPHS[String(Math.floor(minutes / 10))]),
    toGrid(GLYPHS[String(minutes % 10)]),
  ]
  const glyphHeight = glyphs[0]?.length ?? 0
  const startRow = Math.floor((ROWS - glyphHeight) / 2)
  const glyphWidths = glyphs.map((glyph) => glyph[0]?.length ?? 0)
  const totalWidth = glyphWidths.reduce((sum, width) => sum + width, 0)
  const startCol = Math.floor((COLS - totalWidth) / 2)

  return (row, col) => {
    if (row < startRow || row >= startRow + glyphHeight) return NE
    const localCol = col - startCol
    if (localCol < 0 || localCol >= totalWidth) return NE
    let offset = 0
    for (let i = 0; i < glyphs.length; i += 1) {
      const width = glyphWidths[i] ?? 0
      if (localCol >= offset && localCol < offset + width) {
        const glyph = glyphs[i]
        return glyph?.[row - startRow]?.[localCol - offset] ?? NE
      }
      offset += width
    }
    return NE
  }
}

const wavePatternFactory: PatternFactory = (time) => {
  const phase = (time.now * 0.0005 * SPEED) % TAU
  return (row, col) => {
    const angle = ((col + row * 0.3) / COLS) * TAU + phase
    return [angle, angle + 1]
  }
}

const vortexPatternFactory: PatternFactory = (time) => {
  const phase = (time.now * 0.00045 * SPEED) % TAU
  const cx = (COLS - 1) / 2
  const cy = (ROWS - 1) / 2
  return (row, col) => {
    const dx = col - cx
    const dy = row - cy
    const dist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx) / Math.PI + dist * 0.6 + phase
    return [angle, angle + 1]
  }
}

const uniformPatternFactory = (angle: number): PatternFactory =>
  () => () => [angle, angle + 1]

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
    duration: scaleMs(4000),
    hold: scaleMs(4000),
    easing: easeInOutCubic,
    stagger: stagger.radial,
  },
  {
    pattern: wavePatternFactory,
    duration: scaleMs(3000),
    hold: scaleMs(2500),
    easing: easeInOutQuad,
    stagger: stagger.leftToRight,
    continuous: true,
    follow: 900,
  },
  {
    pattern: vortexPatternFactory,
    duration: scaleMs(4000),
    hold: scaleMs(2500),
    easing: easeInOutCubic,
    stagger: stagger.radial,
    continuous: true,
    follow: 900,
  },
  {
    pattern: uniformPatternFactory(0),
    duration: scaleMs(2000),
    hold: scaleMs(1200),
    easing: easeOutBack,
    stagger: stagger.diagonal,
  },
  {
    pattern: randomPatternFactory(42),
    duration: scaleMs(3000),
    hold: scaleMs(1200),
    easing: easeInOutCubic,
    stagger: stagger.random,
  },
]

const buildGrid = (pattern: PatternFn): GridState =>
  Array.from({ length: ROWS }, (_row, r) =>
    Array.from({ length: COLS }, (_col, c) => pattern(r, c))
  )

const wrapDiff = (diff: number) =>
  ((diff + 1) % TAU + TAU) % TAU - 1

const lerpAngle = (from: number, to: number, t: number) =>
  from + wrapDiff(to - from) * t

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
  private lastMinute = -1

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
    from: GridState,
    startTimeOverride?: number
  ) {
    const scene = this.scenes[index]
    const target = buildGrid(scene.pattern({ now, wallTime }))
    const startTime =
      startTimeOverride === undefined ? now : startTimeOverride
    this.sceneIndex = index
    this.sceneStart = startTime
    this.state = {
      from,
      to: target,
      startTime,
      duration: scene.duration,
      easing: scene.easing,
      stagger: scene.stagger,
      staggerMax: this.computeStaggerMax(scene.stagger),
    }
    this.current = from
  }

  private snapToTimeScene(now: number, wallTime: number, from: GridState) {
    const scene = this.scenes[0]
    const target = buildGrid(scene.pattern({ now, wallTime }))
    const staggerMax = this.computeStaggerMax(scene.stagger)
    this.sceneIndex = 0
    this.sceneStart = now - (staggerMax + scene.duration)
    this.state = {
      from: target,
      to: target,
      startTime: this.sceneStart,
      duration: scene.duration,
      easing: scene.easing,
      stagger: scene.stagger,
      staggerMax,
    }
    this.current = target
  }

  compute(now: number): GridState {
    const wallTime = Date.now()
    if (!this.state || !this.current) {
      const initialPattern = randomPatternFactory(7)({ now, wallTime })
      const initialGrid = buildGrid(initialPattern)
      this.enterScene(0, now, wallTime, initialGrid)
      this.lastTime = now
      this.lastMinute = Math.floor(wallTime / 60000)
      return initialGrid
    }

    const minuteMs = 60000
    const minuteStamp = Math.floor(wallTime / minuteMs)
    const msToNextMinute = minuteMs - (wallTime % minuteMs)
    if (minuteStamp !== this.lastMinute) {
      this.lastMinute = minuteStamp
      if (this.sceneIndex === 0) {
        this.snapToTimeScene(now, wallTime, this.current)
      }
    }

    const scene = this.scenes[this.sceneIndex]
    const elapsed = now - this.sceneStart
    const transitionEnd = this.state.staggerMax + this.state.duration
    const dt = this.lastTime ? now - this.lastTime : 0
    this.lastTime = now

    if (this.sceneIndex !== 0 && msToNextMinute <= transitionEnd) {
      const startTime = now - (transitionEnd - msToNextMinute)
      this.enterScene(0, now, wallTime, this.current, startTime)
    }

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

export function ClockGridEngine() {
  const grid = useClockGrid()
  return <ClockGridView grid={grid} />
}
