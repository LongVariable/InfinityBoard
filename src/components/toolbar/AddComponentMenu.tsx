import { useCallback, useRef } from 'react'
import type { BoardItemType } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import { exportToJSON, importFromJSON } from '../../utils/persistence'
import styles from './Toolbar.module.css'

const S = { width: 10, height: 10, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 } as const
const L = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IconTask() {
  return <svg {...S}><rect x="1.5" y="1.5" width="13" height="13" rx="2" {...L} /><path d="M4.5 8L7 10.5L11.5 5.5" {...L} /></svg>
}
function IconText() {
  return <svg {...S}><path d="M2 4.5h12M8 4.5v7" {...L} /></svg>
}
function IconCalendar() {
  return <svg {...S}><rect x="1.5" y="3" width="13" height="11.5" rx="1.5" {...L} /><path d="M1.5 7h13M5 1.5v3M11 1.5v3" {...L} /></svg>
}
function IconImage() {
  return <svg {...S}><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" {...L} /><circle cx="5.5" cy="6.5" r="1.5" {...L} /><path d="M1.5 11l3.5-3 2.5 2 2-2L14 13" {...L} /></svg>
}
function IconCode() {
  return <svg {...S}><path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5M9.5 3l-3 10" {...L} /></svg>
}
function IconTree() {
  return <svg {...S}><path d="M3 2v12M3 7h3" {...L} /><rect x="6" y="1" width="7" height="3" rx="1" {...L} /><rect x="6" y="5.5" width="7" height="3" rx="1" {...L} /><rect x="6" y="10" width="7" height="3" rx="1" {...L} /><path d="M3 3.5h3M3 12h3" {...L} /></svg>
}
function IconExport() {
  return <svg {...S}><path d="M8 2.5v7M5 7l3 3 3-3M2 12.5h12" {...L} /></svg>
}
function IconImport() {
  return <svg {...S}><path d="M8 9.5V2.5M5 5l3-3 3 3M2 12.5h12" {...L} /></svg>
}

interface AddItem {
  type: BoardItemType
  Icon: () => JSX.Element
  title: string
}

const ADD_ITEMS: AddItem[] = [
  { type: 'task',     Icon: IconTask,     title: 'Přidat úkol (T)' },
  { type: 'text',     Icon: IconText,     title: 'Přidat text' },
  { type: 'calendar', Icon: IconCalendar, title: 'Přidat kalendář' },
  { type: 'image',    Icon: IconImage,    title: 'Přidat obrázek' },
  { type: 'code',     Icon: IconCode,     title: 'Přidat kód' },
  { type: 'filetree', Icon: IconTree,     title: 'Přidat strom souborů' },
]

export function AddComponentMenu() {
  const addItem = useBoardStore((s) => s.addItem)
  const items = useBoardStore((s) => s.items)
  const importItems = useBoardStore((s) => s.importItems)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const imported = await importFromJSON(file)
        importItems(imported)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Import selhal')
      }
      e.target.value = ''
    },
    [importItems],
  )

  return (
    <div className={styles.centerSection}>
      {ADD_ITEMS.map(({ type, Icon, title }) => (
        <button
          key={type}
          className={styles.iconBtn}
          onClick={() => addItem(type)}
          title={title}
        >
          <Icon />
        </button>
      ))}
      <span className={styles.divider} />
      <button
        className={styles.iconBtn}
        onClick={() => exportToJSON(items)}
        title="Export do JSON"
      >
        <IconExport />
      </button>
      <button
        className={styles.iconBtn}
        onClick={() => fileInputRef.current?.click()}
        title="Import z JSON"
      >
        <IconImport />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
    </div>
  )
}
