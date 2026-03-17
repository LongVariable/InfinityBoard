export type Tool =
  | 'hand'
  | 'select'
  | 'pencil'
  | 'shapes'
  | 'arrow'
  | 'text'
  | 'task'
  | 'calendar'
  | 'image'
  | 'code'
  | 'filetree'
  | 'delete'

export type ActiveShape = 'rect' | 'circle'
export type TaskPriority = 'none' | 'green' | 'orange' | 'red'
export type TextFontSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface ToolOptions {
  pencilColor: string
  pencilSize: number
  activeShape: ActiveShape
  textFontSize: TextFontSize
  taskPriority: TaskPriority
  codeLang: string
}

export type BoardItemType =
  | 'task'
  | 'text'
  | 'calendar'
  | 'image'
  | 'code'
  | 'filetree'
  | 'pencil'
  | 'shape'
  | 'arrow'

export interface BoardItemBase {
  id: string
  type: BoardItemType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface TaskEntry {
  id: string
  text: string
  completed: boolean
  priority: TaskPriority
}

export interface TaskItem extends BoardItemBase {
  type: 'task'
  tasks: TaskEntry[]
}

export interface TextItem extends BoardItemBase {
  type: 'text'
  content: string
  fontSize: TextFontSize
  color: string
}

export interface CalendarItem extends BoardItemBase {
  type: 'calendar'
  viewYear: number
  viewMonth: number
  markedDates: string[]
  notes: Record<string, string>
}

export interface ImageItem extends BoardItemBase {
  type: 'image'
  src: string
  alt: string
}

export interface CodeBlockItem extends BoardItemBase {
  type: 'code'
  code: string
  language: string
}

export interface FileTreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  expanded?: boolean
  children?: FileTreeNode[]
}

export interface FileTreeItem extends BoardItemBase {
  type: 'filetree'
  title: string
  nodes: FileTreeNode[]
}

export interface PencilItem extends BoardItemBase {
  type: 'pencil'
  d: string
  color: string
  strokeWidth: number
}

export interface ShapeItem extends BoardItemBase {
  type: 'shape'
  shape: ActiveShape
  color: string
  strokeWidth: number
}

export interface ArrowItem extends BoardItemBase {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  startAnchor?: string
  endAnchor?: string
  color: string
  strokeWidth: number
}

export type BoardItem =
  | TaskItem
  | TextItem
  | CalendarItem
  | ImageItem
  | CodeBlockItem
  | FileTreeItem
  | PencilItem
  | ShapeItem
  | ArrowItem

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}
