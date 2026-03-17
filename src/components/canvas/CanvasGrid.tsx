import type { CanvasTransform } from '../../store/types'

interface CanvasGridProps {
  transform: CanvasTransform
}

const BASE_SPACING = 28

export function CanvasGrid({ transform }: CanvasGridProps) {
  const spacing = BASE_SPACING * transform.scale
  // Shift pattern to stay anchored to canvas (0,0)
  const patternX = transform.x % spacing
  const patternY = transform.y % spacing
  const dotRadius = Math.max(0.8, 1.5 * Math.min(transform.scale, 1))

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="dot-grid"
          x={patternX}
          y={patternY}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r={dotRadius} fill="#252535" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  )
}
