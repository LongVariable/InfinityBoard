import { useCallback, useRef } from 'react'
import type { CanvasTransform } from '../store/types'
import { clamp, TOOLBAR_HEIGHT } from '../utils/coordinateUtils'

interface Options {
  transform: CanvasTransform
  setTransform: (t: CanvasTransform) => void
  enabled: boolean
}

export function useCanvasInteraction({ transform, setTransform, enabled }: Options) {
  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const startPan = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    e.preventDefault()
    isPanning.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [enabled])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    const t = transformRef.current
    setTransform({ ...t, x: t.x + dx, y: t.y + dy })
  }, [setTransform])

  const stopPan = useCallback(() => {
    isPanning.current = false
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const t = transformRef.current
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newScale = clamp(t.scale * factor, 0.05, 15)
    const mouseX = e.clientX
    const mouseY = e.clientY - TOOLBAR_HEIGHT
    const worldX = (mouseX - t.x) / t.scale
    const worldY = (mouseY - t.y) / t.scale
    setTransform({
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale,
      scale: newScale,
    })
  }, [setTransform])

  return { startPan, onMouseMove, stopPan, onWheel }
}