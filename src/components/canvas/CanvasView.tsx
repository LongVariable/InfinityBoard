import { useCallback, useEffect, useRef } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction'
import { usePencilDraw } from '../../hooks/usePencilDraw'
import { useArrowDraw } from '../../hooks/useArrowDraw'
import { useShapeDraw } from '../../hooks/useShapeDraw'
import { useDeleteTool } from '../../hooks/useDeleteTool'
import { CanvasWorld } from './CanvasWorld'
import { BoardItemWrapper } from '../board-items/BoardItemWrapper'
import { TOOLBAR_HEIGHT } from '../../utils/coordinateUtils'
import { catmullRomToPath } from '../../utils/smoothPath'
import styles from './CanvasView.module.css'


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

  const isPanning = useRef(false)
  const transformRef = useRef(transform)
  transformRef.current = transform

  const isDrawTool   = ['calendar','code','filetree','shapes','text','task'].includes(activeTool)
  const isPencilTool = activeTool === 'pencil'
  const isArrowTool  = activeTool === 'arrow'

  const { startPan, onMouseMove: panMove, stopPan, onWheel } = useCanvasInteraction({
    transform, setTransform, enabled: activeTool === 'hand',
  })

  const pencil = usePencilDraw({ toolOptions, addItemAt, updateItem })
  const arrow  = useArrowDraw({ items, toolOptions, addItemAt, updateItem })
  const shape  = useShapeDraw({ addItemAt, setActiveTool })
  const del    = useDeleteTool({ items, removeItem })

  // Keep transform refs in sync
  useEffect(() => {
    pencil.setTransformRef(transform)
    arrow.setTransformRef(transform)
    shape.setTransformRef(transform)
    del.setTransformRef(transform)
  }, [transform, pencil, arrow, shape, del])

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
      del.handleDelete(e)
      return
    }
    if (isPencilTool) {
      pencil.startPencil(e)
      return
    }
    if (isArrowTool) {
      arrow.startArrow(e)
      return
    }
    if (isDrawTool) {
      if (onItem) return
      shape.startDraw(e, activeTool)
    }
  }, [activeTool, isDrawTool, isPencilTool, isArrowTool,
      setSelectedId, startPan, pencil, arrow, shape, del])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) { panMove(e); return }
    if (pencil.movePencil(e)) return
    if (arrow.moveArrow(e)) return
    shape.moveDraw(e)
  }, [panMove, pencil, arrow, shape])

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) { isPanning.current = false; stopPan(); return }
    if (pencil.finishPencil()) return
    if (arrow.finishArrow()) return
    shape.finishDraw()
  }, [stopPan, pencil, arrow, shape])

  const handleMouseLeave = useCallback(() => {
    if (isPanning.current) { isPanning.current = false; stopPan() }
    pencil.cancelPencil()
    arrow.cancelArrow()
    shape.cancelDraw()
  }, [stopPan, pencil, arrow, shape])

  const pencilD = pencil.pencilPts && pencil.pencilPts.screen.length > 1
    ? catmullRomToPath(pencil.pencilPts.screen)
    : null

  const arrowPrev = arrow.arrowPreview

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

      {shape.drawState && (
        <div
          className={styles.drawPreview}
          style={{
            left:   Math.min(shape.drawState.startX, shape.drawState.endX),
            top:    Math.min(shape.drawState.startY, shape.drawState.endY),
            width:  Math.abs(shape.drawState.endX - shape.drawState.startX),
            height: Math.abs(shape.drawState.endY - shape.drawState.startY),
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
