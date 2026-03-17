import { useCallback } from 'react'
import type { BoardItem, CanvasTransform } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import { useDraggable } from '../../hooks/useDraggable'
import { TaskItemComp } from './TaskItem'
import { TextItemComp } from './TextItem'
import { CalendarItemComp } from './CalendarItem'
import { ImageItemComp } from './ImageItem'
import { CodeBlockItemComp } from './CodeBlockItem'
import { FileTreeItemComp } from './FileTreeItem'
import { PencilItemComp } from './PencilItem'
import { ShapeItemComp } from './ShapeItem'
import { ArrowItemComp } from './ArrowItem'

interface Props {
  item: BoardItem
  transform: CanvasTransform
}

export function BoardItemWrapper({ item, transform }: Props) {
  const dragItem      = useBoardStore(s => s.dragItem)
  const bringToFront  = useBoardStore(s => s.bringToFront)
  const setSelectedId = useBoardStore(s => s.setSelectedId)
  const selectedId    = useBoardStore(s => s.selectedId)
  const activeTool    = useBoardStore(s => s.activeTool)

  const isSelected    = selectedId === item.id
  const isDrawingItem = item.type === 'pencil' || item.type === 'shape' || item.type === 'arrow'

  const handleDrag = useCallback((id: string, x: number, y: number) => {
    dragItem(id, x, y)
  }, [dragItem])

  const handleDragStart = useCallback(() => {
    bringToFront(item.id)
    setSelectedId(item.id)
  }, [bringToFront, setSelectedId, item.id])

  const { onMouseDown } = useDraggable({
    itemId: item.id,
    itemX: item.x,
    itemY: item.y,
    transform,
    onDrag: handleDrag,
    onDragStart: handleDragStart,
  })

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeTool === 'delete') return   // handled by CanvasView proximity delete
    bringToFront(item.id)
    setSelectedId(item.id)
  }, [activeTool, bringToFront, setSelectedId, item.id])

  return (
    <div
      data-board-item="true"
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        // Drawing items need explicit height so the click area covers the full SVG
        height: isDrawingItem ? item.height : undefined,
        zIndex: item.zIndex,
        // Suppress outline on pencil items before path data is committed (avoids 1-frame flash)
        outline: isSelected && !(item.type === 'pencil' && (item as any).d === '[]') ? '1.5px solid rgba(232,227,216,0.45)' : 'none',
        outlineOffset: isDrawingItem ? '4px' : '0',
        borderRadius: isDrawingItem ? 0 : 10,
        cursor: activeTool === 'delete' ? 'crosshair' : undefined,
      }}
      onClick={handleClick}
    >
      {/* Invisible drag handle at top for card items */}
      {!isDrawingItem && (
        <div
          onMouseDown={activeTool === 'delete' ? undefined : onMouseDown}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 24,
            cursor: activeTool === 'delete' ? 'crosshair' : 'grab',
            zIndex: 10,
            borderRadius: '10px 10px 0 0',
          }}
        />
      )}

      {/* Drawing items — drag the whole bounding box */}
      {isDrawingItem && (
        <div
          onMouseDown={activeTool === 'delete' ? undefined : onMouseDown}
          style={{
            position: 'absolute', inset: 0,
            cursor: activeTool === 'delete' ? 'crosshair' : 'grab',
          }}
        />
      )}

      {item.type === 'task'     && <TaskItemComp      item={item} />}
      {item.type === 'text'     && <TextItemComp      item={item} />}
      {item.type === 'calendar' && <CalendarItemComp  item={item} />}
      {item.type === 'image'    && <ImageItemComp     item={item} />}
      {item.type === 'code'     && <CodeBlockItemComp item={item} />}
      {item.type === 'filetree' && <FileTreeItemComp  item={item} />}
      {item.type === 'pencil'   && <PencilItemComp    item={item} />}
      {item.type === 'shape'    && <ShapeItemComp     item={item} />}
      {item.type === 'arrow'    && <ArrowItemComp     item={item} />}
    </div>
  )
}
