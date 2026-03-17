import { useCallback, useState, useRef, useEffect } from 'react'
import type { FileTreeItem, FileTreeNode } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import { TreeNodeComp } from './TreeNode'
import styles from './FileTreeItem.module.css'

interface Props { item: FileTreeItem }

export function FileTreeItemComp({ item }: Props) {
  const updateItem = useBoardStore(s => s.updateItem)
  const [editingTitle, setEditingTitle] = useState(item.title === 'Projekt')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingTitle) titleRef.current?.focus() }, [editingTitle])

  const commitTitle = useCallback((value: string) => {
    setEditingTitle(false)
    if (value.trim()) updateItem(item.id, { title: value.trim() } as Partial<FileTreeItem>)
  }, [item.id, updateItem])

  // Deep update: replace a node by id anywhere in the tree
  const updateNode = useCallback((updated: FileTreeNode) => {
    const patch = (nodes: FileTreeNode[]): FileTreeNode[] =>
      nodes.map(n =>
        n.id === updated.id ? updated :
        { ...n, children: n.children ? patch(n.children) : undefined }
      )
    updateItem(item.id, { nodes: patch(item.nodes) } as Partial<FileTreeItem>)
  }, [item.id, item.nodes, updateItem])

  // Deep delete: remove a node by id anywhere in the tree
  const deleteNode = useCallback((id: string) => {
    const remove = (nodes: FileTreeNode[]): FileTreeNode[] =>
      nodes
        .filter(n => n.id !== id)
        .map(n => ({ ...n, children: n.children ? remove(n.children) : undefined }))
    updateItem(item.id, { nodes: remove(item.nodes) } as Partial<FileTreeItem>)
  }, [item.id, item.nodes, updateItem])

  const addRoot = useCallback((type: 'folder' | 'file') => {
    const newNode: FileTreeNode = {
      id: crypto.randomUUID(),
      name: type === 'folder' ? 'slozka' : 'soubor.txt',
      type, expanded: true,
      children: type === 'folder' ? [] : undefined,
    }
    updateItem(item.id, { nodes: [...item.nodes, newNode] } as Partial<FileTreeItem>)
  }, [item.id, item.nodes, updateItem])

  return (
    <div className={styles.card}>
      <div className={styles.dragSpace} />
      <div className={styles.header}>
        {editingTitle ? (
          <input
            ref={titleRef}
            className={styles.titleInput}
            defaultValue={item.title}
            onBlur={e => commitTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitTitle(e.currentTarget.value)
              if (e.key === 'Escape') setEditingTitle(false)
              e.stopPropagation()
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className={styles.title}
            onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true) }}
            onMouseDown={e => e.stopPropagation()}
            title="Poklikej pro přejmenování"
          >
            {item.title}/
          </span>
        )}
        <span className={styles.addBtns}>
          <button
            className={styles.addBtn}
            onClick={e => { e.stopPropagation(); addRoot('file') }}
            onMouseDown={e => e.stopPropagation()}
            title="Přidat soubor"
          >+ soubor</button>
          <button
            className={styles.addBtn}
            onClick={e => { e.stopPropagation(); addRoot('folder') }}
            onMouseDown={e => e.stopPropagation()}
            title="Přidat složku"
          >+ složka</button>
        </span>
      </div>
      {item.nodes.length === 0 && (
        <div className={styles.emptyHint}>prázdný projekt</div>
      )}
      <div className={styles.tree} onMouseDown={e => e.stopPropagation()}>
        {item.nodes.map((node, i) => (
          <TreeNodeComp
            key={node.id}
            node={node}
            isLast={i === item.nodes.length - 1}
            depth={0}
            parentLines={[]}
            onUpdate={updateNode}
            onDelete={deleteNode}
          />
        ))}
      </div>
    </div>
  )
}
