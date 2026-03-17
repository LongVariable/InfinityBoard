import { useCallback, useRef, useState } from 'react'
import type { ImageItem } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import styles from './ImageItem.module.css'

interface Props {
  item: ImageItem
}

export function ImageItemComp({ item }: Props) {
  const updateItem = useBoardStore((s) => s.updateItem)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggingOver, setDraggingOver] = useState(false)

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        updateItem(item.id, { src: e.target?.result as string, alt: file.name } as Partial<ImageItem>)
      }
      reader.readAsDataURL(file)
    },
    [item.id, updateItem],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadFile(file)
    },
    [loadFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingOver(false)
      const file = e.dataTransfer.files[0]
      if (file) loadFile(file)
    },
    [loadFile],
  )

  if (!item.src) {
    return (
      <div
        className={`${styles.dropZone} ${draggingOver ? styles.over : ''}`}
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
        onMouseDown={(e) => e.stopPropagation()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOver(true) }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
      >
        <div className={styles.dragSpace} />
        <div className={styles.dropContent}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#6b6880" strokeWidth="1.5" strokeLinecap="round"/>
            <polyline points="17 8 12 3 7 8" stroke="#6b6880" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="#6b6880" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Klikni nebo přetáhni obrázek</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    )
  }

  // When image is loaded — no dragSpace, image fills the card directly
  return (
    <div className={styles.imageCard}>
      <img
        src={item.src}
        alt={item.alt}
        className={styles.img}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  )
}
