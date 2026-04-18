import { computed, ref } from 'vue'
import type { ColorRole } from '~/components/viz/types'

// ---------------------------------------------------------------------------
// Reactive dark-mode tracker (shared across all useVizTheme consumers)
// ---------------------------------------------------------------------------

const darkModeRef = ref(false)
let observer: MutationObserver | null = null

function ensureDarkModeObserver() {
  if (import.meta.server || observer) return
  darkModeRef.value = document.documentElement.classList.contains('dark')
  observer = new MutationObserver(() => {
    const next = document.documentElement.classList.contains('dark')
    if (darkModeRef.value !== next) darkModeRef.value = next
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

// ---------------------------------------------------------------------------
// OKLCH color-space utilities — Björn Ottosson's formulas
// https://bottosson.github.io/posts/oklab/
// ---------------------------------------------------------------------------

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

function rgb01ToHex(r: number, g: number, b: number): string {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
  const toHex = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function rgb01ToOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const rL = srgbToLinear(r)
  const gL = srgbToLinear(g)
  const bL = srgbToLinear(b)
  const l = 0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL
  const m = 0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL
  const s = 0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ]
}

function oklabToRgb01([L, a, b]: [number, number, number]): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const lC = l_ * l_ * l_
  const mC = m_ * m_ * m_
  const sC = s_ * s_ * s_
  return [
    linearToSrgb(4.0767416621 * lC - 3.3077115913 * mC + 0.2309699292 * sC),
    linearToSrgb(-1.2684380046 * lC + 2.6097574011 * mC - 0.3413193965 * sC),
    linearToSrgb(-0.0041960863 * lC - 0.7034186147 * mC + 1.7076147010 * sC),
  ]
}

function oklabToLch([L, a, b]: [number, number, number]): [number, number, number] {
  return [L, Math.sqrt(a * a + b * b), Math.atan2(b, a)]
}
function lchToOklab([L, C, H]: [number, number, number]): [number, number, number] {
  return [L, C * Math.cos(H), C * Math.sin(H)]
}

function hexToOklch(hex: string): [number, number, number] {
  return oklabToLch(rgb01ToOklab(hexToRgb01(hex)))
}
function oklchToHex([L, C, H]: [number, number, number]): string {
  const [r, g, b] = oklabToRgb01(lchToOklab([L, C, H]))
  return rgb01ToHex(r, g, b)
}

/**
 * Mechanically derive a dark-mode color from a light-mode color.
 *
 * Operates in OKLCH (perceptual). Lightness is remapped into the 0.58-0.82
 * band — where a color reads confidently against a dark background — and
 * chroma is nudged down so saturated accents don't go neon on black.
 */
export function deriveDarkColor(lightHex: string): string {
  const [L, C, H] = hexToOklch(lightHex)
  const Ld = Math.max(0.58, Math.min(0.82, 0.96 - L * 0.42))
  const Cd = C * 0.9
  return oklchToHex([Ld, Cd, H])
}

/** Inverse of deriveDarkColor — derive a light-mode color from a dark one. */
export function deriveLightColor(darkHex: string): string {
  const [L, C, H] = hexToOklch(darkHex)
  const Ll = Math.max(0.28, Math.min(0.58, 0.98 - L * 0.72))
  const Cl = C * 1.1
  return oklchToHex([Ll, Cl, H])
}

// ---------------------------------------------------------------------------
// Palette — one source of truth, dark mechanically derived.
// darkOverrides specifies roles whose semantics don't mirror across themes
// (e.g. "chrome" stays muted on both backgrounds, not inverted).
// ---------------------------------------------------------------------------

const lightPalette: Record<ColorRole, string> = {
  'base': '#5B8FA8',
  'base-muted': '#8FAAB8',
  'chrome': '#9CA3AF',
  'severity-amber': '#D97706',
  'severity-muted': '#B4946A',
  'severity-low': '#6B7280',
  'focal': '#6D28D9',
  'divergent': '#E85D75',
  'delta-positive': '#D97706',
  'delta-negative': '#3B82F6',
  'error': '#DC2626',
}

const darkOverrides: Partial<Record<ColorRole, string>> = {
  'chrome': '#6B7280',
  'severity-low': '#9CA3AF',
  'error': '#EF4444',
}

const darkPalette: Record<ColorRole, string> = Object.fromEntries(
  (Object.entries(lightPalette) as [ColorRole, string][]).map(
    ([role, hex]) => [role, darkOverrides[role] ?? deriveDarkColor(hex)],
  ),
) as Record<ColorRole, string>

// ---------------------------------------------------------------------------
// Delta gradient endpoints — dark derived from light.
// ---------------------------------------------------------------------------

const lightDelta = {
  posHi: '#00897b', posLo: '#80cbc4',
  negHi: '#b75a3a', negLo: '#e6b8a3',
}
const darkDelta = {
  posHi: deriveDarkColor(lightDelta.posHi),
  posLo: deriveDarkColor(lightDelta.posLo),
  negHi: deriveDarkColor(lightDelta.negHi),
  negLo: deriveDarkColor(lightDelta.negLo),
}

// ---------------------------------------------------------------------------
// Identity-preserving item palette — 8 hues, dark derived from light.
// ---------------------------------------------------------------------------

const LIGHT_ITEM_PALETTE = [
  '#4a7a8a', // teal (matches base)
  '#b98841', // ochre
  '#5f7a4e', // sage
  '#8a5a7e', // mauve
  '#6d8aa8', // steel
  '#9c6b4f', // terracotta
  '#407b74', // deep teal
  '#a8955c', // olive
]
const DARK_ITEM_PALETTE = LIGHT_ITEM_PALETTE.map(deriveDarkColor)

// ---------------------------------------------------------------------------
// Mixing helpers (linear RGB mix — sufficient for short-range gradients)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function useVizTheme() {
  ensureDarkModeObserver()

  const isDark = computed(() => darkModeRef.value)
  const palette = computed(() => isDark.value ? darkPalette : lightPalette)
  const delta = computed(() => isDark.value ? darkDelta : lightDelta)
  const itemPalette = computed(() => isDark.value ? DARK_ITEM_PALETTE : LIGHT_ITEM_PALETTE)

  function resolve(role: ColorRole): string {
    return palette.value[role]
  }

  function resolveMany(roles: ColorRole[]): string[] {
    return roles.map(r => palette.value[r])
  }

  const colors = computed(() => ({ ...palette.value }))

  const chromeStyle = computed(() => ({
    color: palette.value['chrome'],
    fontSize: 11,
  }))

  const gridLineStyle = computed(() => ({
    color: palette.value['chrome'],
    opacity: 0.3,
  }))

  /**
   * Magnitude-proportional delta color.
   * Blends from lo (muted, near zero) to hi (saturated) by |value|/maxAbs;
   * sign selects positive vs negative hue.
   */
  function deltaColor(value: number, maxAbs: number = 1): string {
    const sat = Math.min(1, Math.abs(value) / maxAbs)
    const d = delta.value
    if (value >= 0) return mixHex(d.posLo, d.posHi, sat)
    return mixHex(d.negLo, d.negHi, sat)
  }

  /** Stable, identity-preserving color for a multi-series index. */
  function itemColor(index: number): string {
    return itemPalette.value[index % itemPalette.value.length]!
  }

  /** Linear RGB mix between two hex colors at parameter t ∈ [0,1]. */
  function mix(aHex: string, bHex: string, t: number): string {
    return mixHex(aHex, bHex, t)
  }

  /**
   * Evenly-spaced gradient of `steps` hex colors between two color roles.
   * Useful for temporally-ordered series (e.g. year-over-year lines) where
   * earliest → gradientFrom and latest → gradientTo should read at a glance.
   */
  function roleGradient(fromRole: ColorRole, toRole: ColorRole, steps: number): string[] {
    if (steps <= 0) return []
    const a = palette.value[fromRole]
    const b = palette.value[toRole]
    if (steps === 1) return [b]
    return Array.from({ length: steps }, (_, i) => mixHex(a, b, i / (steps - 1)))
  }

  return {
    isDark,
    palette,
    resolve,
    resolveMany,
    colors,
    chromeStyle,
    gridLineStyle,
    deltaColor,
    itemColor,
    mix,
    roleGradient,
  }
}
