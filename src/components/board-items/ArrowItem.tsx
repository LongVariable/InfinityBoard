import type { ArrowItem } from '../../store/types'

interface Props { item: ArrowItem }

export function ArrowItemComp({ item }: Props) {
  const { x1, y1, x2, y2, color, strokeWidth, width, height } = item

  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowLen = Math.max(12, strokeWidth * 5)
  const spread = Math.PI / 6

  const ax1 = x2 - arrowLen * Math.cos(angle - spread)
  const ay1 = y2 - arrowLen * Math.sin(angle - spread)
  const ax2 = x2 - arrowLen * Math.cos(angle + spread)
  const ay2 = y2 - arrowLen * Math.sin(angle + spread)

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polyline
        points={`${ax1},${ay1} ${x2},${y2} ${ax2},${ay2}`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
