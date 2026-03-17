import { useCallback, useRef, useEffect } from 'react'
import type { TextItem } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import styles from './TextItem.module.css'

export const fontSizes: Record<TextItem['fontSize'], string> = {
  sm: '13px',
  md: '18px',
  lg: '26px',
  xl: '38px',
  '2xl': '56px',
}

interface Props {
  item: TextItem
}

export function TextItemComp({ item }: Props) {
  const updateItem = useBoardStore((s) => s.updateItem)
  const activeTool = useBoardStore((s) => s.activeTool)
  const ref = useRef<HTMLDivElement>(null)

  const handleInput = useCallback(() => {
    if (ref.current) {
      updateItem(item.id, { content: ref.current.innerText } as Partial<TextItem>)
    }
  }, [item.id, updateItem])

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = item.content
    }
  }, [item.content])

  return (
    <div className={styles.wrapper}>
      <div className={styles.dragSpace} />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={styles.text}
        style={{ fontSize: fontSizes[item.fontSize] }}
        onInput={handleInput}
        onMouseDown={(e) => { if (activeTool !== 'delete') e.stopPropagation() }}
        onClick={(e) => { if (activeTool !== 'delete') e.stopPropagation() }}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  )
}
