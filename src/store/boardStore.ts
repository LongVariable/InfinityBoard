import { create } from 'zustand'
import type {
  BoardItem,
  BoardItemType,
  CanvasTransform,
  TaskItem,
  TaskEntry,
  TextItem,
  CalendarItem,
  ImageItem,
  CodeBlockItem,
  FileTreeItem,
  PencilItem,
  ShapeItem,
  ArrowItem,
  Tool,
  ToolOptions,
} from './types'
import { generateId } from '../utils/idGenerator'
import { getViewportCenter, getInitialTransform, getEdgePoint } from '../utils/coordinateUtils'
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/persistence'

const DEFAULT_TOOL_OPTIONS: ToolOptions = {
  pencilColor: '#e8e3d8',
  pencilSize: 2,
  activeShape: 'rect',
  textFontSize: 'md',
  taskPriority: 'none',
  codeLang: 'javascript',
}

interface BoardStore {
  items: BoardItem[]
  selectedId: string | null
  transform: CanvasTransform

  activeTool: Tool
  toolOptions: ToolOptions

  addItem: (type: BoardItemType) => void
  addItemAt: (type: BoardItemType, x: number, y: number, w: number, h: number) => void
  updateItem: (id: string, changes: Partial<BoardItem>) => void
  removeItem: (id: string) => void
  bringToFront: (id: string) => void
  dragItem: (id: string, x: number, y: number) => void
  setSelectedId: (id: string | null) => void
  setTransform: (t: CanvasTransform) => void
  importItems: (items: BoardItem[]) => void

  clearItems: () => void
  setActiveTool: (tool: Tool) => void
  setToolOption: <K extends keyof ToolOptions>(key: K, value: ToolOptions[K]) => void
}

/** Migrate old saved items that may be missing new fields */
function migrateItem(raw: any): BoardItem {
  if (raw.type === 'task') {
    // Old format had text/completed/priority, new format has tasks[]
    if (!raw.tasks) {
      raw.tasks = [{
        id: crypto.randomUUID(),
        text: raw.text || '',
        completed: raw.completed || false,
        priority: raw.priority || 'none',
      }] as TaskEntry[]
    }
    // Remove old fields
    delete raw.text
    delete raw.completed
    delete raw.priority
  }
  if (raw.type === 'calendar' && !raw.notes) raw.notes = {}
  return raw as BoardItem
}

function createDefaultItem(
  type: BoardItemType,
  x: number,
  y: number,
  w: number,
  h: number,
  toolOptions: ToolOptions,
): BoardItem {
  const base = { id: generateId(), x, y, zIndex: 1 }

  switch (type) {
    case 'task':
      return {
        ...base, type: 'task',
        tasks: [{
          id: generateId(),
          text: '',
          completed: false,
          priority: 'none',
        }],
        width: Math.max(w, 260),
        height: Math.max(h, 60),
      } satisfies TaskItem

    case 'text':
      return {
        ...base, type: 'text',
        content: '',
        fontSize: toolOptions.textFontSize,
        color: '#e8e3d8',
        width: Math.max(w, 100),
        height: Math.max(h, 40),
      } satisfies TextItem

    case 'calendar': {
      const now = new Date()
      return {
        ...base, type: 'calendar',
        viewYear: now.getFullYear(),
        viewMonth: now.getMonth(),
        markedDates: [],
        notes: {},
        width: Math.max(w, 580),
        height: Math.max(h, 300),
      } satisfies CalendarItem
    }

    case 'image':
      return {
        ...base, type: 'image',
        src: '',
        alt: '',
        width: Math.max(w, 240),
        height: Math.max(h, 180),
      } satisfies ImageItem

    case 'code':
      return {
        ...base, type: 'code',
        code: '',
        language: toolOptions.codeLang,
        width: Math.max(w, 400),
        height: Math.max(h, 220),
      } satisfies CodeBlockItem

    case 'filetree':
      return {
        ...base, type: 'filetree',
        title: 'Projekt',
        nodes: [],
        width: Math.max(w, 220),
        height: Math.max(h, 180),
      } satisfies FileTreeItem

    case 'pencil':
      return {
        ...base, type: 'pencil',
        d: '[]',
        color: toolOptions.pencilColor,
        strokeWidth: toolOptions.pencilSize,
        width: Math.max(w, 1),
        height: Math.max(h, 1),
      } satisfies PencilItem

    case 'shape':
      return {
        ...base, type: 'shape',
        shape: toolOptions.activeShape,
        color: toolOptions.pencilColor,
        strokeWidth: toolOptions.pencilSize,
        width: Math.max(w, 60),
        height: Math.max(h, 60),
      } satisfies ShapeItem

    case 'arrow':
      return {
        ...base, type: 'arrow',
        x1: 0, y1: 0,
        x2: Math.max(w, 10),
        y2: Math.max(h, 10),
        color: toolOptions.pencilColor,
        strokeWidth: toolOptions.pencilSize,
        width: Math.max(w, 10),
        height: Math.max(h, 10),
      } satisfies ArrowItem
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(items: BoardItem[], transform: CanvasTransform) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveToLocalStorage(items, transform), 300)
}

const saved = loadFromLocalStorage()

export const useBoardStore = create<BoardStore>((set, get) => ({
  items: (saved?.items ?? []).map(migrateItem),
  selectedId: null,
  transform: saved?.transform ?? getInitialTransform(),
  activeTool: 'select',
  toolOptions: DEFAULT_TOOL_OPTIONS,

  addItem: (type) => {
    const { transform, items, toolOptions } = get()
    const center = getViewportCenter(transform)
    const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex), 0)
    const item = createDefaultItem(type, center.x - 140, center.y - 60, 0, 0, toolOptions)
    item.zIndex = maxZ + 1
    const newItems = [...items, item]
    set({ items: newItems, selectedId: item.id })
    scheduleSave(newItems, transform)
  },

  addItemAt: (type, x, y, w, h) => {
    const { items, transform, toolOptions } = get()
    const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex), 0)
    const ax = w < 0 ? x + w : x
    const ay = h < 0 ? y + h : y
    const aw = Math.abs(w)
    const ah = Math.abs(h)
    const item = createDefaultItem(type, ax, ay, aw, ah, toolOptions)
    item.zIndex = maxZ + 1
    const newItems = [...items, item]
    set({ items: newItems, selectedId: item.id })
    scheduleSave(newItems, transform)
  },

  updateItem: (id, changes) => {
    const { items, transform } = get()
    const newItems = items.map((item) =>
      item.id === id ? ({ ...item, ...changes } as BoardItem) : item,
    )
    set({ items: newItems })
    scheduleSave(newItems, transform)
  },

  removeItem: (id) => {
    const { items, transform, selectedId } = get()
    const filtered = items.filter((item) => item.id !== id)
    // Clear anchor refs in arrows that pointed to the removed item
    const newItems = filtered.map((item) => {
      if (item.type !== 'arrow') return item
      const a = item as ArrowItem
      if (a.startAnchor !== id && a.endAnchor !== id) return item
      return {
        ...a,
        ...(a.startAnchor === id ? { startAnchor: undefined } : {}),
        ...(a.endAnchor === id ? { endAnchor: undefined } : {}),
      } as ArrowItem
    })
    set({ items: newItems, selectedId: selectedId === id ? null : selectedId })
    scheduleSave(newItems, transform)
  },

  bringToFront: (id) => {
    const { items, transform } = get()
    const maxZ = items.reduce((m, i) => Math.max(m, i.zIndex), 0)
    const newItems = items.map((item) =>
      item.id === id ? ({ ...item, zIndex: maxZ + 1 } as BoardItem) : item,
    )
    set({ items: newItems })
    scheduleSave(newItems, transform)
  },

  dragItem: (id, x, y) => {
    const { items, transform } = get()
    const movedItem = items.find((i) => i.id === id)
    if (!movedItem) return
    // Move the item
    let newItems = items.map((item) =>
      item.id === id ? ({ ...item, x, y } as BoardItem) : item,
    )
    // Update any arrows anchored to this item — endpoints follow the item edge
    newItems = newItems.map((item) => {
      if (item.type !== 'arrow') return item
      const a = item as ArrowItem
      const us = a.startAnchor === id
      const ue = a.endAnchor === id
      if (!us && !ue) return item
      // Current absolute positions of both endpoints
      const baseX1 = a.x + a.x1
      const baseY1 = a.y + a.y1
      const baseX2 = a.x + a.x2
      const baseY2 = a.y + a.y2
      let ax1: number, ay1: number, ax2: number, ay2: number
      if (us && ue) {
        // Both ends on the same item — degenerate, keep at center
        const cx = x + movedItem.width / 2
        const cy = y + movedItem.height / 2
        ax1 = cx; ay1 = cy; ax2 = cx; ay2 = cy
      } else if (us) {
        // Start anchored: snap start to the edge of the moved item facing the fixed end
        const ep = getEdgePoint(baseX2, baseY2, x, y, movedItem.width, movedItem.height)
        ax1 = ep.x; ay1 = ep.y
        ax2 = baseX2; ay2 = baseY2
      } else {
        // End anchored: snap end to the edge of the moved item facing the fixed start
        const ep = getEdgePoint(baseX1, baseY1, x, y, movedItem.width, movedItem.height)
        ax1 = baseX1; ay1 = baseY1
        ax2 = ep.x; ay2 = ep.y
      }
      const pad  = 16
      const minX = Math.min(ax1, ax2) - pad
      const minY = Math.min(ay1, ay2) - pad
      const maxX = Math.max(ax1, ax2) + pad
      const maxY = Math.max(ay1, ay2) + pad
      return {
        ...a,
        x: minX, y: minY,
        width: maxX - minX, height: maxY - minY,
        x1: ax1 - minX, y1: ay1 - minY,
        x2: ax2 - minX, y2: ay2 - minY,
      } as ArrowItem
    })
    set({ items: newItems })
    scheduleSave(newItems, transform)
  },

  setSelectedId: (id) => set({ selectedId: id }),

  setTransform: (t) => {
    const { items } = get()
    set({ transform: t })
    scheduleSave(items, t)
  },

  importItems: (newItems) => {
    const { transform } = get()
    set({ items: newItems.map(migrateItem) })
    scheduleSave(newItems, transform)
  },

  clearItems: () => {
    const { transform } = get()
    set({ items: [], selectedId: null })
    scheduleSave([], transform)
  },

  setActiveTool: (tool) => set({ activeTool: tool }),

  setToolOption: (key, value) =>
    set((s) => ({ toolOptions: { ...s.toolOptions, [key]: value } })),
}))
