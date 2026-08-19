import { useCallback, useRef, useState } from 'react'
import type { BoardItem, CanvasTransform, ToolOptions, ArrowItem } from '../store/types'
import { screenToCanvas, TOOLBAR_HEIGHT, getEdgePoint } from '../utils/coordinateUtils'
import { useBoardStore } from '../store/boardStore'

interface ArrowState {
  x1: number; y1: number
  x2: number; y2: number
  startAnchorId?: string
}

interface Options {
  items: BoardItem[]
  toolOptions: ToolOptions
  addItemAt: (type: 'arrow', x: number, y: number, w: number, h: number) => string
  updateItem: (id: string, changes: Partial<ArrowItem>) => void
}

export function useArrowDraw({ items, toolOptions, addItemAt, updateItem }: Options) {
  const [arrowState, setArrowState] = useState<ArrowState | null>(null)
  const arrowRef = useRef<ArrowState | null>(null)
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })

  const setTransformRef = useCallback((t: CanvasTransform) => {
    transformRef.current = t
  }, [])

  const startArrow = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const t = transformRef.current
    const cp = screenToCanvas(e.clientX, e.clientY - TOOLBAR_HEIGHT, t)
    // Snap start to item center if clicking inside an item
    const hitStart = [...items].sort((a, b) => b.zIndex - a.zIndex).find(item =>
      item.type !== 'arrow' &&
      cp.x >= item.x && cp.x <= item.x + item.width &&
      cp.y >= item.y && cp.y <= item.y + item.height
    )
    let x1 = e.clientX, y1 = e.clientY - TOOLBAR_HEIGHT
    let startAnchorId: string | undefined
    if (hitStart) {
      startAnchorId = hitStart.id
      x1 = (hitStart.x + hitStart.width  / 2) * t.scale + t.x
      y1 = (hitStart.y + hitStart.height / 2) * t.scale + t.y
    }
    const ar: ArrowState = { x1, y1, x2: e.clientX, y2: e.clientY - TOOLBAR_HEIGHT, startAnchorId }
    arrowRef.current = ar
    setArrowState({ ...ar })
  }, [items])

  const moveArrow = useCallback((e: React.MouseEvent) => {
    if (!arrowRef.current) return false
    const ar = { ...arrowRef.current, x2: e.clientX, y2: e.clientY - TOOLBAR_HEIGHT }
    arrowRef.current = ar
    setArrowState({ ...ar })
    return true
  }, [])

  const finishArrow = useCallback(() => {
    if (!arrowRef.current) return false
    const ar = arrowRef.current
    const t = transformRef.current
    const curItems = useBoardStore.getState().items

    // --- Start point ---
    const startAnchorId = ar.startAnchorId
    const startItem = startAnchorId ? curItems.find(i => i.id === startAnchorId) : undefined
    const rawSc = startItem
      ? { x: startItem.x + startItem.width / 2, y: startItem.y + startItem.height / 2 }
      : screenToCanvas(ar.x1, ar.y1, t)

    // --- End point ---
    const cpEnd = screenToCanvas(ar.x2, ar.y2, t)
    const hitEnd = [...curItems].sort((a, b) => b.zIndex - a.zIndex).find(item =>
      item.type !== 'arrow' &&
      cpEnd.x >= item.x && cpEnd.x <= item.x + item.width &&
      cpEnd.y >= item.y && cpEnd.y <= item.y + item.height
    )
    const endAnchorId = hitEnd?.id
    const rawEc = hitEnd
      ? { x: hitEnd.x + hitEnd.width / 2, y: hitEnd.y + hitEnd.height / 2 }
      : cpEnd

    // --- Apply edge intersection ---
    const sc = startItem
      ? getEdgePoint(rawEc.x, rawEc.y, startItem.x, startItem.y, startItem.width, startItem.height)
      : rawSc
    const ec = hitEnd
      ? getEdgePoint(rawSc.x, rawSc.y, hitEnd.x, hitEnd.y, hitEnd.width, hitEnd.height)
      : rawEc

    const dx = ec.x - sc.x
    const dy = ec.y - sc.y
    if (Math.sqrt(dx * dx + dy * dy) > 20) {
      const pad = 16
      const minX = Math.min(sc.x, ec.x) - pad
      const minY = Math.min(sc.y, ec.y) - pad
      const maxX = Math.max(sc.x, ec.x) + pad
      const maxY = Math.max(sc.y, ec.y) + pad
      const newId = addItemAt('arrow', minX, minY, maxX - minX, maxY - minY)
      updateItem(newId, {
        x1: sc.x - minX, y1: sc.y - minY,
        x2: ec.x - minX, y2: ec.y - minY,
        startAnchor: startAnchorId,
        endAnchor: endAnchorId,
      } as Partial<ArrowItem>)
    }
    arrowRef.current = null
    setArrowState(null)
    return true
  }, [addItemAt, updateItem])

  const cancelArrow = useCallback(() => {
    arrowRef.current = null
    setArrowState(null)
  }, [])

  const arrowPreview = arrowState && (() => {
    const { x1, y1, x2, y2 } = arrowState
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const len = Math.max(12, toolOptions.pencilSize * 5)
    const sp = Math.PI / 6
    return {
      x1, y1, x2, y2,
      ax1: x2 - len * Math.cos(ang - sp), ay1: y2 - len * Math.sin(ang - sp),
      ax2: x2 - len * Math.cos(ang + sp), ay2: y2 - len * Math.sin(ang + sp),
    }
  })()

  const isDrawing = arrowRef.current !== null

  return { arrowState, arrowPreview, startArrow, moveArrow, finishArrow, cancelArrow, isDrawing, setTransformRef }
}
