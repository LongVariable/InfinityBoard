import type { ShapeItem } from '../../store/types'

interface Props { item: ShapeItem }

export function ShapeItemComp({ item }: Props) {
  const w = item.width
  const h = item.height
  const sw = item.strokeWidth
  const pad = sw * 2

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        overflow: 'visible',
        pointerEvents: 'none',
        }}
      viewBox={`0 0 ${w} ${h}`}
    >
      {item.shape === 'rect' && (
        <rect
          x={pad} y={pad}
          width={Math.max(1, w - pad * 2)}
          height={Math.max(1, h - pad * 2)}
          rx="6"
          stroke={item.color}
          strokeWidth={sw}
          fill="none"
        />
      )}
      {item.shape === 'circle' && (
        <ellipse
          cx={w / 2} cy={h / 2}
          rx={Math.max(1, w / 2 - pad)}
          ry={Math.max(1, h / 2 - pad)}
          stroke={item.color}
          strokeWidth={sw}
          fill="none"
        />
      )}
    </svg>
  )
}
