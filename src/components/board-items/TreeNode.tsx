import { useState, useCallback, useRef, useEffect } from 'react'
import type { FileTreeNode } from '../../store/types'
import styles from './FileTreeItem.module.css'

interface TreeNodeProps {
  node: FileTreeNode
  isLast: boolean
  depth: number
  parentLines: boolean[]   // true = draw │ at that ancestor level
  onUpdate: (updated: FileTreeNode) => void
  onDelete: (id: string) => void
}

export function TreeNodeComp({ node, isLast, depth, parentLines, onUpdate, onDelete }: TreeNodeProps) {
  const [editing, setEditing]   = useState(false)
  const [hovered, setHovered]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const toggleExpand = useCallback(() => {
    if (node.type !== 'folder') return
    onUpdate({ ...node, expanded: !node.expanded })
  }, [node, onUpdate])

  const commitEdit = useCallback((value: string) => {
    setEditing(false)
    if (value.trim()) onUpdate({ ...node, name: value.trim() })
  }, [node, onUpdate])

  const addChild = useCallback((type: 'folder' | 'file') => {
    const newNode: FileTreeNode = {
      id: crypto.randomUUID(),
      name: type === 'folder' ? 'nova-slozka' : 'novy-soubor',
      type,
      expanded: true,
      children: type === 'folder' ? [] : undefined,
    }
    onUpdate({ ...node, expanded: true, children: [...(node.children ?? []), newNode] })
  }, [node, onUpdate])

  const updateChild = useCallback((updated: FileTreeNode) => {
    onUpdate({ ...node, children: (node.children ?? []).map(c => c.id === updated.id ? updated : c) })
  }, [node, onUpdate])

  const deleteChild = useCallback((id: string) => {
    onUpdate({ ...node, children: (node.children ?? []).filter(c => c.id !== id) })
  }, [node, onUpdate])

  const nameLabel  = node.name + (node.type === 'folder' ? '/' : '')
  const childParentLines = [...parentLines, !isLast]

  return (
    <div>
      <div
        className={styles.node}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* vertical continuation lines from ancestors */}
        {parentLines.map((hasLine, i) => (
          <span key={i} className={`${styles.indent} ${hasLine ? styles.indentLine : ''}`} />
        ))}
        {/* branch connector */}
        <span className={`${styles.connectorSpan} ${isLast ? styles.connectorLast : styles.connectorMiddle}`} />
        {editing ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            defaultValue={node.name}
            onBlur={e => commitEdit(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitEdit(e.currentTarget.value)
              if (e.key === 'Escape') setEditing(false)
              e.stopPropagation()
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={`${styles.nodeName} ${node.type === 'folder' ? styles.folder : ''}`}
            onDoubleClick={() => setEditing(true)}
            onClick={node.type === 'folder' ? toggleExpand : undefined}
          >
            {nameLabel}
          </span>
        )}
        {hovered && !editing && (
          <span className={styles.nodeActions}>
            {node.type === 'folder' && (
              <>
                <button className={styles.actionBtn} onClick={() => addChild('file')}   title="Novy soubor">+f</button>
                <button className={styles.actionBtn} onClick={() => addChild('folder')} title="Nova slozka">+d</button>
              </>
            )}
            <button className={styles.actionBtn} style={{ color: '#555' }} onClick={() => onDelete(node.id)} title="Smazat">x</button>
          </span>
        )}
      </div>
      {node.type === 'folder' && node.expanded && (node.children ?? []).map((child, i) => (
        <TreeNodeComp
          key={child.id}
          node={child}
          isLast={i === (node.children ?? []).length - 1}
          depth={depth + 1}
          parentLines={childParentLines}
          onUpdate={updateChild}
          onDelete={deleteChild}
        />
      ))}
    </div>
  )
}
