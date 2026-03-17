import { useCallback, useRef } from 'react'
import type { CanvasTransform } from '../store/types'

interface UseDraggableOptions {
  itemId: string
  itemX: number
  itemY: number
  transform: CanvasTransform
  onDrag: (id: string, x: number, y: number) => void
  onDragStart?: () => void
}

export function useDraggable({
  itemId,
  itemX,
  itemY,
  transform,
  onDrag,
  onDragStart,
}: UseDraggableOptions) {
  const dragging = useRef(false)
  const startMouse = useRef({ x: 0, y: 0 })
  const startItem = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()

      dragging.current = true
      startMouse.current = { x: e.clientX, y: e.clientY }
      startItem.current = { x: itemX, y: itemY }
      onDragStart?.()

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return
        const deltaScreen = {
          x: ev.clientX - startMouse.current.x,
          y: ev.clientY - startMouse.current.y,
        }
        const deltaCanvas = {
          x: deltaScreen.x / transform.scale,
          y: deltaScreen.y / transform.scale,
        }
        onDrag(itemId, startItem.current.x + deltaCanvas.x, startItem.current.y + deltaCanvas.y)
      }

      const onUp = () => {
        dragging.current = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [itemId, itemX, itemY, transform.scale, onDrag, onDragStart],
  )

  return { onMouseDown }
}
