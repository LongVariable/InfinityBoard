import type { BoardItem, CanvasTransform } from '../store/types'

const STORAGE_KEY = 'infinityboard_data'
const VERSION = 1

interface StoredData {
  version: number
  items: BoardItem[]
  transform: CanvasTransform
}

export function saveToLocalStorage(items: BoardItem[], transform: CanvasTransform): void {
  try {
    const data: StoredData = { version: VERSION, items, transform }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    console.warn('InfinityBoard: Failed to save to localStorage')
  }
}

export function loadFromLocalStorage(): { items: BoardItem[]; transform: CanvasTransform } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredData
    if (!data.items || !data.transform) return null
    return { items: data.items, transform: data.transform }
  } catch {
    return null
  }
}

export function exportToJSON(items: BoardItem[]): void {
  const data = JSON.stringify({ version: VERSION, items }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `infinityboard-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importFromJSON(file: File): Promise<BoardItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as { items: BoardItem[] }
        if (!Array.isArray(data.items)) throw new Error('Invalid format')
        resolve(data.items)
      } catch {
        reject(new Error('Nepodařilo se načíst soubor. Ověř, že jde o platný InfinityBoard JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Chyba čtení souboru'))
    reader.readAsText(file)
  })
}
