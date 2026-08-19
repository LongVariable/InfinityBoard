import { useCallback, useEffect, useRef, useState } from 'react'
import type { Tool, ToolOptions } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import { exportToJSON, importFromJSON } from '../../utils/persistence'
import styles from './Toolbar.module.css'

/* ── SVG icon helpers ── */
function Ico({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const IHand     = () => <Ico><path d="M8 3v7M6 5v5M4 7v4a5 5 0 005 5h1a5 5 0 005-5V9.5a1 1 0 00-2 0M8 10V3M10 10V5a1 1 0 012 0v4"/></Ico>
const ISelect   = () => <Ico><path d="M5 4l10 5.5-5 1.3L8.3 17 5 4z"/></Ico>
const IPencil   = () => <Ico><path d="M14.5 3.5l2 2a1.4 1.4 0 010 2l-9 9L4 18l1.5-3.5 9-9a1.4 1.4 0 012 0z"/><path d="M13 5l2 2"/></Ico>
const IShapes   = () => <Ico><rect x="3" y="3" width="7" height="7" rx="1.5"/><circle cx="13.5" cy="13.5" r="3.5"/></Ico>
const IArrow    = () => <Ico><path d="M4 10h12M12 6l4 4-4 4"/><circle cx="4" cy="10" r="2" fill="currentColor"/></Ico>
const IText     = () => <Ico><path d="M4 5h12M10 5v11"/></Ico>
const ITask     = () => <Ico><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10.5l2.5 2.5L13 8"/></Ico>
const ICalendar = () => <Ico><rect x="3" y="5" width="14" height="12" rx="1.5"/><path d="M3 9h14M7 3v3M13 3v3"/></Ico>
const ICode     = () => <Ico><path d="M7 7L3 10l4 3M13 7l4 3-4 3M11 4l-2 12"/></Ico>
const ITree     = () => <Ico><path d="M3 5h4M3 10h4M3 15h4"/><path d="M7 5v10M7 7.5h3M7 12.5h3"/><rect x="10" y="4" width="7" height="3" rx="1"/><rect x="10" y="9" width="7" height="3" rx="1"/></Ico>
const IDelete   = () => <Ico><path d="M5 5l10 10M15 5L5 15"/></Ico>
const IExport   = () => <Ico><path d="M10 3v9M7 9l3 3 3-3M4 16h12"/></Ico>
const IImport   = () => <Ico><path d="M10 11V2M7 5l3-3 3 3M4 16h12"/></Ico>
const IClear    = () => <Ico><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></Ico>

type ActionId = 'export' | 'import' | 'clear'
type ToolDef = { id: Tool | ActionId; Icon: () => JSX.Element; title: string; special?: boolean }

const TOOL_DEFS: Array<ToolDef | 'sep'> = [
  { id: 'hand',     Icon: IHand,     title: 'Ručka – posun (H)' },
  { id: 'select',   Icon: ISelect,   title: 'Výběr (V)' },
  'sep',
  { id: 'pencil',   Icon: IPencil,   title: 'Tužka (P)', special: true },
  { id: 'shapes',   Icon: IShapes,   title: 'Tvary',     special: true },
  { id: 'arrow',    Icon: IArrow,    title: 'Šipka' },
  'sep',
  { id: 'text',     Icon: IText,     title: 'Text (T)',  special: true },
  { id: 'task',     Icon: ITask,     title: 'Úkol' },
  { id: 'calendar', Icon: ICalendar, title: 'Kalendář' },
  { id: 'code',     Icon: ICode,     title: 'Kód',       special: true },
  { id: 'filetree', Icon: ITree,     title: 'Strom souborů' },
  'sep',
  { id: 'delete',   Icon: IDelete,   title: 'Smazat (Del)' },
  { id: 'clear',    Icon: IClear,    title: 'Vymazat vše' },
  'sep',
  { id: 'export',   Icon: IExport,   title: 'Export JSON' },
  { id: 'import',   Icon: IImport,   title: 'Import JSON' },
]

const PENCIL_COLORS = ['#e8e3d8','#999','#f97316','#ef4444','#4ade80','#60a5fa','#facc15','#e879f9']

const TEXT_SIZES: Array<{ key: ToolOptions['textFontSize']; px: number }> = [
  { key: 'sm', px: 11 }, { key: 'md', px: 14 }, { key: 'lg', px: 18 },
  { key: 'xl', px: 23 }, { key: '2xl', px: 29 },
]


const CODE_LANGS = ['javascript','typescript','html','css','python','csharp','sql']
const CODE_LABELS: Record<string, string> = {
  javascript:'JS', typescript:'TS', html:'HTML', css:'CSS', python:'PY', csharp:'C#', sql:'SQL',
}

/* ── Uptime counter ── */
function Uptime() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(secs / 3600)).padStart(2, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return <span className={styles.uptime}>{h}:{m}:{s}</span>
}

/* ── Clock display ── */
function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const days   = ['Ne','Po','Út','St','Čt','Pá','So']
  const dateStr = `${days[now.getDay()]} ${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()}`
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  return (
    <div className={styles.clock}>
      <span className={styles.clockDate}>{dateStr}</span>
      <span className={styles.clockTime}>{timeStr}</span>
    </div>
  )
}

/* ── Main Toolbar ── */
export function Toolbar() {
  const activeTool    = useBoardStore(s => s.activeTool)
  const toolOptions   = useBoardStore(s => s.toolOptions)
  const setActiveTool = useBoardStore(s => s.setActiveTool)
  const setToolOption = useBoardStore(s => s.setToolOption)
  const items         = useBoardStore(s => s.items)
  const clearItems    = useBoardStore(s => s.clearItems)
  const importItems   = useBoardStore(s => s.importItems)
  const selectedId    = useBoardStore(s => s.selectedId)
  const removeItem    = useBoardStore(s => s.removeItem)

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLElement>(null)

  /* Close submenu when clicking outside toolbar */
  useEffect(() => {
    if (!openSubmenu) return
    const h = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) setOpenSubmenu(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [openSubmenu])

  /* Keyboard shortcuts */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      switch (e.key) {
        case 'h': setActiveTool('hand');   setOpenSubmenu(null); break
        case 'v': setActiveTool('select'); setOpenSubmenu(null); break
        case 'p': setActiveTool('pencil'); setOpenSubmenu(null); break
        case 't': setActiveTool('text');   setOpenSubmenu(null); break
        case 'Escape': setActiveTool('select'); setOpenSubmenu(null); break
        case 'Delete': case 'Backspace':
          if (selectedId) removeItem(selectedId)
          break
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setActiveTool, selectedId, removeItem])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      importItems(await importFromJSON(file))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import selhal')
    }
    e.target.value = ''
  }, [importItems])

  const handleToolClick = (id: string) => {
    if (id === 'export') { exportToJSON(items); return }
    if (id === 'import') { fileRef.current?.click(); return }
    if (id === 'clear') {
      if (window.confirm('Opravdu chceš vymazat celou tabuli? Tato akce nejde vrátit.')) {
        clearItems()
      }
      return
    }
    const tool = id as Tool
    setActiveTool(tool)
    const def = TOOL_DEFS.find(d => d !== 'sep' && (d as ToolDef).id === id) as ToolDef | undefined
    if (def?.special) {
      setOpenSubmenu(prev => prev === id ? null : id)
    } else {
      setOpenSubmenu(null)
    }
  }

  const renderSubmenu = (id: string) => {
    if (openSubmenu !== id) return null

    if (id === 'pencil') return (
      <div className={styles.submenu}>
        {PENCIL_COLORS.map(c => (
          <button key={c} className={`${styles.subBtn} ${toolOptions.pencilColor === c ? styles.subActive : ''}`}
            onClick={() => setToolOption('pencilColor', c)} title={c}>
            <span className={styles.colorDot} style={{ background: c }} />
          </button>
        ))}
        <div className={styles.subDivider} />
        {[1, 2, 4].map(sz => (
          <button key={sz} className={`${styles.subBtn} ${toolOptions.pencilSize === sz ? styles.subActive : ''}`}
            onClick={() => setToolOption('pencilSize', sz)} title={`${sz}px`}>
            <div className={styles.sizeLine} style={{ height: Math.max(1, sz) }} />
          </button>
        ))}
      </div>
    )

    if (id === 'shapes') return (
      <div className={styles.submenu}>
        {(['rect', 'circle'] as const).map(shape => (
          <button key={shape}
            className={`${styles.subBtn} ${toolOptions.activeShape === shape ? styles.subActive : ''}`}
            onClick={() => { setToolOption('activeShape', shape); setOpenSubmenu(null) }}
            title={shape === 'rect' ? 'Obdélník' : 'Kruh'}>
            {shape === 'rect'
              ? <Ico><rect x="4" y="4" width="12" height="12" rx="2"/></Ico>
              : <Ico><circle cx="10" cy="10" r="6"/></Ico>}
          </button>
        ))}
      </div>
    )

    if (id === 'text') return (
      <div className={styles.submenu}>
        {TEXT_SIZES.map(({ key, px }) => (
          <button key={key}
            className={`${styles.subBtn} ${toolOptions.textFontSize === key ? styles.subActive : ''}`}
            onClick={() => { setToolOption('textFontSize', key); setOpenSubmenu(null) }}
            title={key} style={{ fontSize: px, fontFamily: 'Kalam, cursive', height: 28 + (px - 11) }}>
            A
          </button>
        ))}
      </div>
    )



    if (id === 'code') return (
      <div className={styles.submenu}>
        {CODE_LANGS.map(lang => (
          <button key={lang}
            className={`${styles.subBtn} ${toolOptions.codeLang === lang ? styles.subActive : ''}`}
            onClick={() => { setToolOption('codeLang', lang); setOpenSubmenu(null) }}
            title={lang} style={{ fontSize: 9, letterSpacing: '0.02em' }}>
            {CODE_LABELS[lang]}
          </button>
        ))}
      </div>
    )

    return null
  }

  return (
    <header ref={toolbarRef} className={styles.toolbar} data-toolbar="true">
      <div className={styles.left}><Uptime /></div>

      <div className={styles.center}>
        {TOOL_DEFS.map((def, i) => {
          if (def === 'sep') return <span key={`sep-${i}`} className={styles.sep} />
          const d = def as ToolDef
          const isAction = d.id === 'export' || d.id === 'import'
          const isActive  = !isAction && activeTool === (d.id as Tool)
          return (
            <div key={d.id} className={styles.toolGroup}>
              <button
                className={`${styles.toolBtn} ${isActive ? styles.active : ''} ${d.special ? styles.special : ''}`}
                onClick={() => handleToolClick(d.id)}
                title={d.title}
              >
                <d.Icon />
              </button>
              {d.special && renderSubmenu(d.id)}
            </div>
          )
        })}
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      <div className={styles.right}><Clock /></div>
    </header>
  )
}
