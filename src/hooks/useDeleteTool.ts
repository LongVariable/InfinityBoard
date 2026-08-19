import { useCallback, useRef } from 'react'
import type { BoardItem, CanvasTransform } from '../store/types'
import { screenToCanvas, TOOLBAR_HEIGHT } from '../utils/coordinateUtils'

/** Shortest distance from point (px,py) to segment (ax,ay)→(bx,by) */
function distPointToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

interface Options {
  items: BoardItem[]
  removeItem: (id: string) => void
}

export function useDeleteTool({ items, removeItem }: Options) {
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })

  const setTransformRef = useCallback((t: CanvasTransform) => {
    transformRef.current = t
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    const t = transformRef.current
    const cp = screenToCanvas(e.clientX, e.clientY - TOOLBAR_HEIGHT, t)
    const HIT = 32 / t.scale

    const hit = [...items]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(item => {
        if (item.type === 'pencil') {
          let pts: Array<{ x: number; y: number }> = []
          try { pts = JSON.parse(item.d) } catch { return false }
          if (pts.length === 0) return false
          const threshold = item.strokeWidth / 2 + HIT
          return pts.some((p, i) => {
            const ax = item.x + p.x, ay = item.y + p.y
            if (i < pts.length - 1) {
              const p2 = pts[i + 1]
              return distPointToSegment(cp.x, cp.y, ax, ay, item.x + p2.x, item.y + p2.y) < threshold
            }
            return Math.hypot(cp.x - ax, cp.y - ay) < threshold
          })
        }
        return (
          cp.x >= item.x - HIT && cp.x <= item.x + item.width  + HIT &&
          cp.y >= item.y - HIT && cp.y <= item.y + item.height + HIT
        )
      })

    if (hit) removeItem(hit.id)
  }, [items, removeItem])

  return { handleDelete, setTransformRef }
}
