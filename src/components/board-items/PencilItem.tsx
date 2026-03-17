import type { PencilItem } from '../../store/types'
import { catmullRomToPath } from '../../utils/smoothPath'

interface Props { item: PencilItem }

export function PencilItemComp({ item }: Props) {
  let points: Array<{ x: number; y: number }> = []
  try { points = JSON.parse(item.d) } catch { return null }
  if (points.length < 2) return null

  const d = catmullRomToPath(points)

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: item.width,
        height: item.height,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${item.width} ${item.height}`}
    >
      <path
        d={d}
        stroke={item.color}
        strokeWidth={item.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
