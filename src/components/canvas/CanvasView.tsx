import { useCallback, useRef, useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import { CanvasWorld } from './CanvasWorld'
import { BoardItemWrapper } from '../board-items/BoardItemWrapper'
import { TOOLBAR_HEIGHT, screenToCanvas, getEdgePoint } from '../../utils/coordinateUtils'
import { catmullRomToPath } from '../../utils/smoothPath'
import styles from './CanvasView.module.css'
import type { BoardItemType } from '../../store/types'

interface DrawState {
  startX: number; startY: number
  endX: number;   endY: number
  tool: string
}

interface PtList {
  screen: Array<{ x: number; y: number }>
  canvas: Array<{ x: number; y: number }>
}

interface ArrowState {
  x1: number; y1: number
  x2: number; y2: number
  startAnchorId?: string
}

/** Shortest distance from point (px,py) to segment (ax,ay)→(bx,by) */
function distPointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

export function CanvasView() {
  const items         = useBoardStore(s => s.items)
  const transform     = useBoardStore(s => s.transform)
  const setTransform  = useBoardStore(s => s.setTransform)
  const setSelectedId = useBoardStore(s => s.setSelectedId)
  const activeTool    = useBoardStore(s => s.activeTool)
  const toolOptions   = useBoardStore(s => s.toolOptions)
  const addItemAt     = useBoardStore(s => s.addItemAt)
  const updateItem    = useBoardStore(s => s.updateItem)
  const removeItem    = useBoardStore(s => s.removeItem)
  const setActiveTool = useBoardStore(s => s.setActiveTool)

  const [drawState,  setDrawState]  = useState<DrawState | null>(null)
  const [pencilPts,  setPencilPts]  = useState<PtList | null>(null)
  const [arrowState, setArrowState] = useState<ArrowState | null>(null)

  const drawRef   = useRef<DrawState | null>(null)
  const pencilRef = useRef<PtList | null>(null)
  const arrowRef  = useRef<ArrowState | null>(null)
  const isPanning = useRef(false)
  const transformRef = useRef(transform)
  transformRef.current = transform

  const isDrawTool   = ['calendar','image','code','filetree','shapes','text','task'].includes(activeTool)
  const isPlaceTool  = false
  const isPencilTool = activeTool === 'pencil'
  const isArrowTool  = activeTool === 'arrow'

  const { startPan, onMouseMove: panMove, stopPan, onWheel } = useCanvasInteraction({
    transform, setTransform, enabled: activeTool === 'hand',
  })

  const sy = (clientY: number) => clientY - TOOLBAR_HEIGHT

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const onItem = (e.target as HTMLElement).closest('[data-board-item]')

    if (activeTool === 'hand') {
      if (!onItem) { isPanning.current = true; startPan(e) }
      return
    }
    if (activeTool === 'select') {
      if (!onItem) setSelectedId(null)
      return
    }
    if (activeTool === 'delete') {
      const cp  = screenToCanvas(e.clientX, sy(e.clientY), transformRef.current)
      const HIT = 32 / transformRef.current.scale   // ~32px screen tolerance
      const hit = [...items]
        .sort((a, b) => b.zIndex - a.zIndex)
        .find(item => {
          if (item.type === 'pencil') {
            // Precise segment-proximity test against the actual stroke path
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
      return
    }

    if (isPlaceTool) {
      if (onItem) return
      const cp = screenToCanvas(e.clientX, sy(e.clientY), transformRef.current)
      addItemAt(activeTool as BoardItemType, cp.x - 120, cp.y - 50, 240, 100)
      setActiveTool('select')
      return
    }

    if (isPencilTool) {
      e.preventDefault()
      const sp = { x: e.clientX, y: sy(e.clientY) }
      const cp = screenToCanvas(sp.x, sp.y, transformRef.current)
      const pts: PtList = { screen: [sp], canvas: [cp] }
      pencilRef.current = pts
      setPencilPts({ ...pts })
      return
    }

    if (isArrowTool) {
      e.preventDefault()
      const t  = transformRef.current
      const cp = screenToCanvas(e.clientX, sy(e.clientY), t)
      // Snap start to item center if clicking inside an item
      const hitStart = [...items].sort((a, b) => b.zIndex - a.zIndex).find(item =>
        item.type !== 'arrow' &&
        cp.x >= item.x && cp.x <= item.x + item.width &&
        cp.y >= item.y && cp.y <= item.y + item.height
      )
      let x1 = e.clientX, y1 = sy(e.clientY)
      let startAnchorId: string | undefined
      if (hitStart) {
        startAnchorId = hitStart.id
        x1 = (hitStart.x + hitStart.width  / 2) * t.scale + t.x
        y1 = (hitStart.y + hitStart.height / 2) * t.scale + t.y
      }
      const ar: ArrowState = { x1, y1, x2: e.clientX, y2: sy(e.clientY), startAnchorId }
      arrowRef.current = ar
      setArrowState({ ...ar })
      return
    }

    if (isDrawTool) {
      if (onItem) return
      e.preventDefault()
      const ds: DrawState = {
        startX: e.clientX, startY: sy(e.clientY),
        endX:   e.clientX, endY:   sy(e.clientY),
        tool: activeTool,
      }
      drawRef.current = ds
      setDrawState({ ...ds })
    }
  }, [activeTool, isDrawTool, isPlaceTool, isPencilTool, isArrowTool,
      items, removeItem, addItemAt, setActiveTool, setSelectedId, startPan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) { panMove(e); return }

    if (pencilRef.current) {
      const sp = { x: e.clientX, y: sy(e.clientY) }
      const cp = screenToCanvas(sp.x, sp.y, transformRef.current)
      const pts: PtList = {
        screen: [...pencilRef.current.screen, sp],
        canvas: [...pencilRef.current.canvas, cp],
      }
      pencilRef.current = pts
      setPencilPts({ ...pts })
      return
    }

    if (arrowRef.current) {
      const ar = { ...arrowRef.current, x2: e.clientX, y2: sy(e.clientY) }
      arrowRef.current = ar
      setArrowState({ ...ar })
      return
    }

    if (drawRef.current) {
      const ds = { ...drawRef.current, endX: e.clientX, endY: sy(e.clientY) }
      drawRef.current = ds
      setDrawState({ ...ds })
    }
  }, [panMove])

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) { isPanning.current = false; stopPan(); return }

    if (pencilRef.current) {
      const pts = pencilRef.current
      if (pts.canvas.length > 1) {
        const xs   = pts.canvas.map(p => p.x)
        const ys   = pts.canvas.map(p => p.y)
        const minX = Math.min(...xs), minY = Math.min(...ys)
        const maxX = Math.max(...xs), maxY = Math.max(...ys)
        const pad  = toolOptions.pencilSize * 2
        const w    = maxX - minX + pad * 2
        const h    = maxY - minY + pad * 2
        const rel  = pts.canvas.map(p => ({ x: p.x - minX + pad, y: p.y - minY + pad }))
        addItemAt('pencil', minX - pad, minY - pad, w, h)
        setTimeout(() => {
          const { items: cur } = useBoardStore.getState()
          const newest = cur[cur.length - 1]
          if (newest?.type === 'pencil') {
            updateItem(newest.id, { d: JSON.stringify(rel) } as any)
          }
        }, 0)
      }
      pencilRef.current = null
      setPencilPts(null)
      return
    }

    if (arrowRef.current) {
      const ar  = arrowRef.current
      const t   = transformRef.current
      const { items: curItems } = useBoardStore.getState()
      // --- Start point ---
      const startAnchorId = ar.startAnchorId
      const startItem = startAnchorId ? curItems.find(i => i.id === startAnchorId) : undefined
      // Raw center of start anchor (used to compute end edge direction)
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
      // Raw center of end anchor (used to compute start edge direction)
      const rawEc = hitEnd
        ? { x: hitEnd.x + hitEnd.width / 2, y: hitEnd.y + hitEnd.height / 2 }
        : cpEnd
      // --- Apply edge intersection so arrow touches the item border, not its center ---
      const sc = startItem
        ? getEdgePoint(rawEc.x, rawEc.y, startItem.x, startItem.y, startItem.width, startItem.height)
        : rawSc
      const ec = hitEnd
        ? getEdgePoint(rawSc.x, rawSc.y, hitEnd.x, hitEnd.y, hitEnd.width, hitEnd.height)
        : rawEc
      const dx  = ec.x - sc.x
      const dy  = ec.y - sc.y
      if (Math.sqrt(dx * dx + dy * dy) > 20) {
        const pad  = 16
        const minX = Math.min(sc.x, ec.x) - pad
        const minY = Math.min(sc.y, ec.y) - pad
        const maxX = Math.max(sc.x, ec.x) + pad
        const maxY = Math.max(sc.y, ec.y) + pad
        addItemAt('arrow', minX, minY, maxX - minX, maxY - minY)
        setTimeout(() => {
          const { items: cur } = useBoardStore.getState()
          const newest = cur[cur.length - 1]
          if (newest?.type === 'arrow') {
            updateItem(newest.id, {
              x1: sc.x - minX, y1: sc.y - minY,
              x2: ec.x - minX, y2: ec.y - minY,
              startAnchor: startAnchorId,
              endAnchor: endAnchorId,
            } as any)
          }
        }, 0)
      }
      arrowRef.current = null
      setArrowState(null)
      return
    }

    if (drawRef.current) {
      const ds = drawRef.current
      const dx = ds.endX - ds.startX
      const dy = ds.endY - ds.startY
      // Text only needs a drag in one direction (can be wide + short)
      const enoughDrag = (ds.tool === 'text' || ds.tool === 'task')
        ? Math.abs(dx) > 10 || Math.abs(dy) > 10
        : Math.abs(dx) > 20 && Math.abs(dy) > 20
      if (enoughDrag) {
        const t  = transformRef.current
        const sc = screenToCanvas(ds.startX, ds.startY, t)
        const ec = screenToCanvas(ds.endX,   ds.endY,   t)
        if (ds.tool === 'shapes') {
          addItemAt('shape', sc.x, sc.y, ec.x - sc.x, ec.y - sc.y)
        } else {
          addItemAt(ds.tool as BoardItemType, sc.x, sc.y, ec.x - sc.x, ec.y - sc.y)
          setActiveTool('select')
        }
      }
      drawRef.current = null
      setDrawState(null)
    }
  }, [stopPan, addItemAt, setActiveTool, updateItem, toolOptions.pencilSize])

  const handleMouseLeave = useCallback(() => {
    if (isPanning.current) { isPanning.current = false; stopPan() }
    drawRef.current   = null; setDrawState(null)
    pencilRef.current = null; setPencilPts(null)
    arrowRef.current  = null; setArrowState(null)
  }, [stopPan])

  const pencilD = pencilPts && pencilPts.screen.length > 1
    ? catmullRomToPath(pencilPts.screen)
    : null

  const arrowPrev = arrowState && (() => {
    const { x1, y1, x2, y2 } = arrowState
    const ang = Math.atan2(y2 - y1, x2 - x1)
    const len = Math.max(12, toolOptions.pencilSize * 5)
    const sp  = Math.PI / 6
    return {
      x1, y1, x2, y2,
      ax1: x2 - len * Math.cos(ang - sp), ay1: y2 - len * Math.sin(ang - sp),
      ax2: x2 - len * Math.cos(ang + sp), ay2: y2 - len * Math.sin(ang + sp),
    }
  })()

  return (
    <div
      className={styles.canvasView}
      style={{ top: TOOLBAR_HEIGHT }}
      data-tool={activeTool}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={onWheel}
    >
      <CanvasWorld transform={transform}>
        {items.map(item => (
          <BoardItemWrapper key={item.id} item={item} transform={transform} />
        ))}
      </CanvasWorld>

      {drawState && (
        <div
          className={styles.drawPreview}
          style={{
            left:   Math.min(drawState.startX, drawState.endX),
            top:    Math.min(drawState.startY, drawState.endY),
            width:  Math.abs(drawState.endX - drawState.startX),
            height: Math.abs(drawState.endY - drawState.startY),
          }}
        />
      )}

      {pencilD && (
        <svg className={styles.pencilOverlay}>
          <path
            d={pencilD}
            stroke={toolOptions.pencilColor}
            strokeWidth={toolOptions.pencilSize}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )}

      {arrowPrev && (
        <svg className={styles.pencilOverlay}>
          <line
            x1={arrowPrev.x1} y1={arrowPrev.y1}
            x2={arrowPrev.x2} y2={arrowPrev.y2}
            stroke={toolOptions.pencilColor}
            strokeWidth={toolOptions.pencilSize}
            strokeLinecap="round"
          />
          <polyline
            points={arrowPrev.ax1 + ',' + arrowPrev.ay1 + ' ' + arrowPrev.x2 + ',' + arrowPrev.y2 + ' ' + arrowPrev.ax2 + ',' + arrowPrev.ay2}
            stroke={toolOptions.pencilColor}
            strokeWidth={toolOptions.pencilSize}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
