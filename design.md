# A Million Times 120 — 技术解析与 React 复现设计

---

## 一、原作工程原理

### 物理结构

A Million Times 120 由 **120 个时钟**排列成矩阵（通常 **12列 × 10行**），每个时钟有**两根独立控制的指针**（时针和分针，但这里都作为纯粹的图形元素使用）。

### 控制系统

```
中央控制器 (PC)
    │
    ├── 计算所有 240 根指针的目标角度
    ├── 生成运动轨迹（缓动曲线）
    │
    ▼
步进电机驱动板 (串联通信)
    │
    ├── 每个时钟 = 2个步进电机
    ├── 各指针独立寻址、独立转速
    │
    ▼
120 个时钟单元（机械执行）
```

**核心思想：每根指针只是一个"可独立旋转到任意角度的线段"。** 通过精心编排 240 根线段的角度与运动时序，涌现出波浪、文字、图案、真实时间显示等效果。

### 效果分类

| 模式 | 原理 |
|------|------|
| **显示时间** | 每个时钟的两根指针摆到标准时/分位置 |
| **波浪/漩涡** | 角度 = f(row, col, time)，用正弦/螺旋函数 |
| **文字/图案** | 预计算每根指针的目标角度，拼成像素字形 |
| **混沌→秩序** | 各指针随机旋转 → 同步收敛到目标 |

---

## 二、数据模型设计

### 核心状态：极简表达

```typescript
// 一个时钟 = 两个角度（弧度制，0 = 12点方向，顺时针）
type ClockState = [number, number] // [handA, handB]

// 整个装置 = 二维矩阵
type GridState = ClockState[][]    // [row][col]

// 尺寸常量
const ROWS = 10
const COLS = 12
```

### 动画模型：从当前态到目标态

```typescript
interface AnimationFrame {
  target: GridState            // 目标角度
  duration: number             // 过渡时长 ms
  easing: EasingFn             // 缓动函数
  stagger?: StaggerFn          // 时序偏移（制造波浪感）
}

// 缓动
type EasingFn = (t: number) => number

// 每个时钟的延迟偏移，参数为 (row, col) → 延迟 ms
type StaggerFn = (row: number, col: number) => number
```

**动画运行时状态：**

```typescript
interface RuntimeState {
  from: GridState              // 起始角度（快照）
  to: GridState                // 目标角度
  startTime: number            // 动画开始时间
  duration: number
  easing: EasingFn
  stagger: StaggerFn
}

// 插值计算（每帧调用）
function interpolate(state: RuntimeState, now: number): GridState {
  return state.from.map((row, r) =>
    row.map(([a0, b0], c) => {
      const delay = state.stagger(r, c)
      const elapsed = Math.max(0, now - state.startTime - delay)
      const t = Math.min(1, elapsed / state.duration)
      const e = state.easing(t)
      const [a1, b1] = state.to[r][c]
      return [
        lerpAngle(a0, a1, e),
        lerpAngle(b0, b1, e),
      ] as ClockState
    })
  )
}

// 角度插值（总是走最短路径，或指定方向）
function lerpAngle(from: number, to: number, t: number): number {
  // 标准化到 [0, 2π)
  const TAU = Math.PI * 2
  let diff = ((to - from) % TAU + TAU) % TAU
  if (diff > Math.PI) diff -= TAU  // 走短弧
  return from + diff * t
}
```

---

## 三、Pattern 生成器

每个 Pattern 就是一个 **`(row, col, time?) → ClockState`** 的纯函数。

```typescript
type PatternFn = (row: number, col: number) => ClockState
```

### 1. 显示当前时间

将数字 0-9 和冒号编码为时钟指针角度：

```typescript
// 每个数字占 3列 × 5行 的时钟区域
// 每个时钟的两根指针组合出一个"笔画方向"

// 指针角度常量（12点=0, 3点=π/2, 6点=π, 9点=3π/2）
const U = 0              // ↑  12点
const R = Math.PI / 2    // →  3点
const D = Math.PI         // ↓  6点
const L = 3 * Math.PI / 2 // ←  9点
const UR = Math.PI / 4
const DR = 3 * Math.PI / 4
const DL = 5 * Math.PI / 4
const UL = 7 * Math.PI / 4

// 数字字形表：每个数字 = 5行3列，每格两个角度
const DIGIT_GLYPHS: Record<string, ClockState[][]> = {
  '0': [
    [[D,R], [D,L], [D,L]],
    [[U,D], [D,R], [U,D]],
    [[U,D], [U,D], [U,D]],
    [[U,D], [U,R], [U,D]],
    [[U,R], [U,R], [U,L]],
  ],
  '1': [
    [[DR,DR],[D,L], [DL,DL]],
    [[UR,UR],[U,D], [UL,UL]],
    [[DR,DR],[U,D], [DL,DL]],
    [[UR,UR],[U,D], [UL,UL]],
    [[UR,UR],[U,U], [UL,UL]],
  ],
  // ... 其余数字类似编码
}

function timePattern(hours: number, mins: number): PatternFn {
  // 布局: [H1(3col)] [H2(3col)] [:(2col)] [M1(3col)] [M2(3col)]
  // 总计: 3+3+0+3+3 = 12 列（冒号可融入间距）
  const digits = [
    Math.floor(hours / 10),
    hours % 10,
    Math.floor(mins / 10),
    mins % 10,
  ]
  // 将字形映射到 10行×12列 网格（居中，上下留白）
  return (row, col) => {
    // ... 查表返回对应角度
  }
}
```

### 2. 波浪

```typescript
function wavePattern(phase: number): PatternFn {
  return (row, col) => {
    const angle = ((col + row * 0.3) / COLS) * Math.PI * 2 + phase
    return [angle, angle + Math.PI]  // 两针始终对径
  }
}
```

### 3. 漩涡

```typescript
function vortexPattern(phase: number): PatternFn {
  const cx = (COLS - 1) / 2
  const cy = (ROWS - 1) / 2
  return (row, col) => {
    const dx = col - cx
    const dy = row - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) + dist * 0.5 + phase
    return [angle, angle + Math.PI]
  }
}
```

### 4. 全部指向同一方向（呼吸/对齐）

```typescript
function uniformPattern(angle: number): PatternFn {
  return () => [angle, angle + Math.PI]
}
```

### 5. 随机散开

```typescript
function randomPattern(seed: number): PatternFn {
  return (row, col) => {
    const hash = pseudoRandom(seed + row * COLS + col)
    return [hash * Math.PI * 2, pseudoRandom(hash) * Math.PI * 2]
  }
}
```

---

## 四、Stagger 函数库（时序魔法）

Stagger 是让动画具有"涟漪感"的关键：

```typescript
const stagger = {
  // 无延迟，全部同步
  none: () => 0,

  // 从左到右
  leftToRight: (row: number, col: number) =>
    col * 80,

  // 从中心扩散
  radial: (row: number, col: number) => {
    const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2
    return Math.sqrt((col - cx) ** 2 + (row - cy) ** 2) * 100
  },

  // 对角线
  diagonal: (row: number, col: number) =>
    (row + col) * 60,

  // 随机
  random: (row: number, col: number) =>
    pseudoRandom(row * COLS + col) * 500,
}
```

---

## 五、编排引擎（Sequence）

```typescript
interface Scene {
  pattern: PatternFn
  duration: number        // 过渡动画时长
  hold: number            // 停留时长
  easing: EasingFn
  stagger: StaggerFn
}

const screensaverSequence: Scene[] = [
  // 1. 随机 → 显示时间
  { pattern: currentTimePattern, duration: 2000, hold: 5000,
    easing: easeInOutCubic, stagger: stagger.radial },

  // 2. 时间 → 波浪
  { pattern: wavePattern(0), duration: 1500, hold: 4000,
    easing: easeInOutQuad, stagger: stagger.leftToRight },

  // 3. 波浪 → 漩涡
  { pattern: vortexPattern(0), duration: 2000, hold: 4000,
    easing: easeInOutCubic, stagger: stagger.radial },

  // 4. 漩涡 → 全对齐
  { pattern: uniformPattern(0), duration: 1000, hold: 2000,
    easing: easeOutBack, stagger: stagger.diagonal },

  // 循环...
]
```

**持续动画（波浪等）** 可在 hold 期间持续更新 phase：

```typescript
// 波浪 hold 期间，每帧微调 target
function continuousWave(runtime: RuntimeState, now: number) {
  const phase = now * 0.001
  // 直接更新 runtime.to 为新的 wavePattern(phase) 结果
}
```

---

## 六、React 组件架构

```
<App>
  └─ <ClockGrid>               ← 编排引擎 + RAF 循环
       └─ <Clock> × 120        ← 纯渲染，接收两个角度
            ├─ <circle>         ← 表盘
            ├─ <line handA>     ← 指针A
            └─ <line handB>     ← 指针B
```

### Clock 组件（极简）

```tsx
const Clock = memo(({ a, b }: { a: number; b: number }) => (
  <svg viewBox="-50 -50 100 100" width={60} height={60}>
    <circle r={45} fill="none" stroke="#333" strokeWidth={1} />
    <line
      x1={0} y1={0}
      x2={Math.sin(a) * 35} y2={-Math.cos(a) * 35}
      stroke="#fff" strokeWidth={3} strokeLinecap="round"
    />
    <line
      x1={0} y1={0}
      x2={Math.sin(b) * 35} y2={-Math.cos(b) * 35}
      stroke="#fff" strokeWidth={3} strokeLinecap="round"
    />
    <circle r={3} fill="#fff" />
  </svg>
))
```

### 主循环（核心 Hook）

```tsx
function useClockGrid(): GridState {
  const engineRef = useRef(new SequenceEngine(screensaverSequence))
  const [grid, setGrid] = useState<GridState>(initialGrid)

  useEffect(() => {
    let raf: number
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
```

### 性能优化要点

```
1. Clock 用 memo — 角度未变则不重渲染
2. 角度比较用阈值 — |Δ| < 0.01 视为相等
3. 可选：用 Canvas 替代 120 个 SVG（更高性能）
4. 可选：用 CSS transform: rotate() 替代计算坐标
```

---

## 七、整体数据流

```
┌──────────────────────────────────────────────┐
│              Sequence Engine                  │
│                                              │
│  scenes[] ──▶ currentScene                   │
│                   │                          │
│          PatternFn(row, col)                 │
│                   │                          │
│              targetGrid                      │
│                   │                          │
│    interpolate(from, target, t, stagger)     │
│                   │                          │
│            currentGrid: GridState            │
│         (240 个浮点数，每帧更新)               │
│                                              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
         React render (120 × <Clock>)
```

**整个系统的优雅之处在于：所有复杂的视觉效果，归结为一件事——决定 240 个角度值。**
