import type { ClockState } from './ClockGridView'

// Glyph Definition Interface
interface GlyphDefinition {
  rows: number;
  cols: number;
  /** data, from left to right, top to bottom */
  clocks: ClockState[];
}

/** Clock Hand Directions */
const U = 0
const R = 0.5
const D = 1
const L = 1.5

type GlyphChar = '━' | '┃' | '┏' | '┓' | '┗' | '┛' | '╸' | '╹' | '╺' | '╻' | ' ' // Space for empty cell
type GlyphString = `${GlyphChar}${GlyphChar}` | `${GlyphChar}${GlyphChar}${GlyphChar}`

/** Clock Glyph Map */
const GLYPH_MAP: Record<GlyphChar, ClockState> = {
  '━': [R, L], // Horizontal
  '┃': [U, D], // Vertical
  '┏': [R, D], // Top-left corner
  '┓': [L, D], // Top-right corner
  '┗': [R, U], // Bottom-left corner
  '┛': [L, U], // Bottom-right corner
  '╸': [L, L], // Left
  '╹': [U, U], // Up
  '╺': [R, R], // Right
  '╻': [D, D], // Down
  ' ': [-1, -1], // Empty cell, can be overridden by lower layers
}

function parseGlyph(rows: GlyphString[]): GlyphDefinition {
  const clockStates: ClockState[] = []
  const numRows = rows.length
  const numCols = rows[0].length

  for (const row of rows) {
    for (const char of row) {
      const clockState = GLYPH_MAP[char as GlyphChar]
      clockStates.push(clockState)
    }
  }

  return {
    rows: numRows,
    cols: numCols,
    clocks: clockStates,
  }
}

// 字体库常量
export const GLYPHS: Record<string, GlyphDefinition> = {
  '0': parseGlyph([
    '┏━┓',
    '┃╻┃',
    '┃┃┃',
    '┃┃┃',
    '┃╹┃',
    '┗━┛',
  ]),
  '1': parseGlyph([
    ' ┏┓',
    ' ┃┃',
    ' ┃┃',
    ' ┃┃',
    ' ┃┃',
    ' ┗┛',
  ]),
  '2': parseGlyph([
    '┏━┓',
    '┗┓┃',
    '┏┛┃',
    '┃┏┛',
    '┃┗┓',
    '┗━┛',
  ]),
  '3': parseGlyph([
    '┏━┓',
    '┗┓┃',
    '┏┛┃',
    '┗┓┃',
    '┏┛┃',
    '┗━┛',
  ]),
  '4': parseGlyph([
    '┏┓┓',
    '┃┃┃',
    '┃┗┃',
    '┗┓┃',
    ' ┃┃',
    ' ┗┛',
  ]),
  '5': parseGlyph([
    '┏━┓',
    '┃┏┛',
    '┃┗┓',
    '┗┓┃',
    '┏┛┃',
    '┗━┛',
  ]),
  '6': parseGlyph([
    '┏━┓',
    '┃┏┛',
    '┃┗┓',
    '┃╻┃',
    '┃╹┃',
    '┗━┛',
  ]),
  '7': parseGlyph([
    '┏━┓',
    '┗┓┃',
    ' ┃┃',
    ' ┃┃',
    ' ┃┃',
    ' ┗┛',
  ]),
  '8': parseGlyph([
    '┏━┓',
    '┃╻┃',
    '┃╹┃',
    '┃╻┃',
    '┃╹┃',
    '┗━┛',
  ]),
  '9': parseGlyph([
    '┏━┓',
    '┃╻┃',
    '┃╹┃',
    '┗┓┃',
    '┏┛┃',
    '┗━┛',
  ]),
  ':': parseGlyph([
    '  ',
    '┏┓',
    '┗┛',
    '┏┓',
    '┗┛',
    '  ',
  ])
};
