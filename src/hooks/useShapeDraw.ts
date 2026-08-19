import { useCallback, useRef, useState } from 'react'
import type { CanvasTransform, BoardItemType } from '../store/types'
import { screenToCanvas, TOOLBAR_HEIGHT } from '../utils/coordinateUtils'

interface DrawState {
  startX: number; startY: number
  endX: number;   endY: number
  tool: string
}

interface Options {
  addItemAt: (type: BoardItemType, x: number, y: number, w: number, h: number) => string
  setActiveTool: (tool: 'select') => void
}

export function useShapeDraw({ addItemAt, setActiveTool }: Options) {
  const [drawState, setDrawState] = useState<DrawState | null>(null)
  const drawRef = useRef<DrawState | null>(null)
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })

  const setTransformRef = useCallback((t: CanvasTransform) => {
    transformRef.current = t
  }, [])

  const startDraw = useCallback((e: React.MouseEvent, tool: string) => {
    e.preventDefault()
    const sy = e.clientY - TOOLBAR_HEIGHT
    const ds: DrawState = {
      startX: e.clientX, startY: sy,
      endX:   e.clientX, endY:   sy,
      tool,
    }
    drawRef.current = ds
    setDrawState({ ...ds })
  }, [])

  const moveDraw = useCallback((e: React.MouseEvent) => {
    if (!drawRef.current) return false
    const ds = { ...drawRef.current, endX: e.clientX, endY: e.clientY - TOOLBAR_HEIGHT }
    drawRef.current = ds
    setDrawState({ ...ds })
    return true
  }, [])

  const finishDraw = useCallback(() => {
    if (!drawRef.current) return false
    const ds = drawRef.current
    const dx = ds.endX - ds.startX
    const dy = ds.endY - ds.startY
    const enoughDrag = (ds.tool === 'text' || ds.tool === 'task')
      ? Math.abs(dx) > 10 || Math.abs(dy) > 10
      : Math.abs(dx) > 20 && Math.abs(dy) > 20
    if (enoughDrag) {
      const t = transformRef.current
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
    return true
  }, [addItemAt, setActiveTool])

  const cancelDraw = useCallback(() => {
    drawRef.current = null
    setDrawState(null)
  }, [])

  const isDrawing = drawRef.current !== null

  return { drawState, startDraw, moveDraw, finishDraw, cancelDraw, isDrawing, setTransformRef }
}
