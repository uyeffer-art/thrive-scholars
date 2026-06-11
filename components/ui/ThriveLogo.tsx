// Thrive Scholars logo — isometric cube pyramid mark + wordmark.
// Recreated as inline SVG so it stays crisp at any size.

const HX = 16   // cube half-width
const VT = 9    // top-face half-height
const VS = 18   // side-face height

// Brand palette
const NAVY  = '#143a6b'
const BLUE  = '#1b4d8a'
const TEAL  = '#5aa7c4'
const ORANGE = '#ec5c29'
const YELLOW = '#f7b926'

// Each cube: apex (x,y) + the 3 face colors (top, left, right)
const CUBES = [
  { x: 48, y: 0,  top: BLUE,   left: TEAL,   right: ORANGE }, // top
  { x: 32, y: 27, top: YELLOW, left: TEAL,   right: NAVY   }, // mid-left
  { x: 64, y: 27, top: NAVY,   left: ORANGE, right: TEAL   }, // mid-right
  { x: 16, y: 54, top: TEAL,   left: NAVY,   right: YELLOW }, // bottom-left
  { x: 48, y: 54, top: ORANGE, left: TEAL,   right: NAVY   }, // bottom-mid
  { x: 80, y: 54, top: TEAL,   left: YELLOW, right: ORANGE }, // bottom-right
]

function faces(x: number, y: number) {
  const A  = `${x},${y}`
  const B  = `${x + HX},${y + VT}`
  const C  = `${x},${y + 2 * VT}`
  const D  = `${x - HX},${y + VT}`
  const B2 = `${x + HX},${y + VT + VS}`
  const C2 = `${x},${y + 2 * VT + VS}`
  const D2 = `${x - HX},${y + VT + VS}`
  return {
    top:   `${A} ${B} ${C} ${D}`,
    left:  `${D} ${C} ${C2} ${D2}`,
    right: `${B} ${C} ${C2} ${B2}`,
  }
}

type Size = 'sm' | 'md' | 'lg'
type Variant = 'dark' | 'light'

const SIZES: Record<Size, { mark: number; thrive: number; scholars: number; divider: number; gap: number }> = {
  sm: { mark: 26, thrive: 13, scholars: 8,    divider: 2,   gap: 8 },
  md: { mark: 34, thrive: 17, scholars: 10.5, divider: 2.5, gap: 10 },
  lg: { mark: 46, thrive: 23, scholars: 14,   divider: 3,   gap: 13 },
}

export default function ThriveLogo({
  size = 'md',
  variant = 'dark',
  markOnly = false,
}: {
  size?: Size
  variant?: Variant
  markOnly?: boolean
}) {
  const s = SIZES[size]
  const markW = Math.round(s.mark * (96 / 90))
  const wordColor = variant === 'light' ? '#ffffff' : '#15487f'

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${s.gap}px` }}>
      {/* Cube pyramid mark */}
      <svg width={markW} height={s.mark} viewBox="0 0 96 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Thrive Scholars">
        {CUBES.map((c, i) => {
          const f = faces(c.x, c.y)
          return (
            <g key={i}>
              <polygon points={f.left} fill={c.left} />
              <polygon points={f.right} fill={c.right} />
              <polygon points={f.top} fill={c.top} />
            </g>
          )
        })}
      </svg>

      {/* Wordmark */}
      {!markOnly && (
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 800, letterSpacing: '0.04em', color: wordColor, fontSize: `${s.thrive}px` }}>
            THRIVE
          </span>
          <span style={{ height: `${s.divider}px`, background: ORANGE, width: '100%', margin: `${s.divider}px 0` }} />
          <span style={{ fontWeight: 800, letterSpacing: '0.155em', color: wordColor, fontSize: `${s.scholars}px` }}>
            SCHOLARS
          </span>
        </span>
      )}
    </span>
  )
}
