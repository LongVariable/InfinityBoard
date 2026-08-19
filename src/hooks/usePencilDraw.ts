import { useCallback, useRef, useState } from 'react'
import type { CanvasTransform, ToolOptions, PencilItem } from '../store/types'
import { screenToCanvas, TOOLBAR_HEIGHT } from '../utils/coordinateUtils'

interface PtList {
  screen: Array<{ x: number; y: number }>
  canvas: Array<{ x: number; y: number }>
}

interface Options {
  toolOptions: ToolOptions
  addItemAt: (type: 'pencil', x: number, y: number, w: number, h: number) => string
  updateItem: (id: string, changes: Partial<PencilItem>) => void
}

export function usePencilDraw({ toolOptions, addItemAt, updateItem }: Options) {
  const [pencilPts, setPencilPts] = useState<PtList | null>(null)
  const pencilRef = useRef<PtList | null>(null)
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })

  const setTransformRef = useCallback((t: CanvasTransform) => {
    transformRef.current = t
  }, [])

  const startPencil = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const sp = { x: e.clientX, y: e.clientY - TOOLBAR_HEIGHT }
    const cp = screenToCanvas(sp.x, sp.y, transformRef.current)
    const pts: PtList = { screen: [sp], canvas: [cp] }
    pencilRef.current = pts
    setPencilPts({ ...pts })
  }, [])

  const movePencil = useCallback((e: React.MouseEvent) => {
    if (!pencilRef.current) return false
    const sp = { x: e.clientX, y: e.clientY - TOOLBAR_HEIGHT }
    const cp = screenToCanvas(sp.x, sp.y, transformRef.current)
    const pts: PtList = {
      screen: [...pencilRef.current.screen, sp],
      canvas: [...pencilRef.current.canvas, cp],
    }
    pencilRef.current = pts
    setPencilPts({ ...pts })
    return true
  }, [])

  const finishPencil = useCallback(() => {
    if (!pencilRef.current) return false
    const pts = pencilRef.current
    if (pts.canvas.length > 1) {
      const xs = pts.canvas.map(p => p.x)
      const ys = pts.canvas.map(p => p.y)
      const minX = Math.min(...xs), minY = Math.min(...ys)
      const maxX = Math.max(...xs), maxY = Math.max(...ys)
      const pad = toolOptions.pencilSize * 2
      const w = maxX - minX + pad * 2
      const h = maxY - minY + pad * 2
      const rel = pts.canvas.map(p => ({ x: p.x - minX + pad, y: p.y - minY + pad }))
      const newId = addItemAt('pencil', minX - pad, minY - pad, w, h)
      updateItem(newId, { d: JSON.stringify(rel) } as Partial<PencilItem>)
    }
    pencilRef.current = null
    setPencilPts(null)
    return true
  }, [addItemAt, updateItem, toolOptions.pencilSize])

  const cancelPencil = useCallback(() => {
    pencilRef.current = null
    setPencilPts(null)
  }, [])

  const isDrawing = pencilRef.current !== null

  return { pencilPts, startPencil, movePencil, finishPencil, cancelPencil, isDrawing, setTransformRef }
}
