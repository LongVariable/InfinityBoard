import { useCallback, useRef } from 'react'
import type { TaskItem, TaskEntry, TaskPriority } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import styles from './TaskItem.module.css'

interface Props {
  item: TaskItem
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  none:   'rgba(232,227,216,0.15)',
  green:  '#4ade80',
  orange: '#f97316',
  red:    '#ef4444',
}

const PRIORITIES: TaskPriority[] = ['none', 'green', 'orange', 'red']

export function TaskItemComp({ item }: Props) {
  const updateItem = useBoardStore(s => s.updateItem)
  const rowRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const updateTasks = useCallback((tasks: TaskEntry[]) => {
    updateItem(item.id, { tasks } as Partial<TaskItem>)
  }, [item.id, updateItem])

  const toggleTask = useCallback((id: string) => {
    updateTasks(item.tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ))
  }, [item.tasks, updateTasks])

  const updateTaskText = useCallback((id: string, text: string) => {
    updateTasks(item.tasks.map(t =>
      t.id === id ? { ...t, text } : t
    ))
  }, [item.tasks, updateTasks])

  const cyclePriority = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    updateTasks(item.tasks.map(t => {
      if (t.id !== id) return t
      const idx = PRIORITIES.indexOf(t.priority)
      return { ...t, priority: PRIORITIES[(idx + 1) % PRIORITIES.length] }
    }))
  }, [item.tasks, updateTasks])

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    taskId: string,
    idx: number,
  ) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      const newTask: TaskEntry = {
        id: crypto.randomUUID(),
        text: '',
        completed: false,
        priority: 'none',
      }
      const newTasks = [...item.tasks]
      newTasks.splice(idx + 1, 0, newTask)
      updateTasks(newTasks)
      // focus new input
      setTimeout(() => rowRefs.current[newTask.id]?.focus(), 0)
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '' && item.tasks.length > 1) {
      e.preventDefault()
      const newTasks = item.tasks.filter(t => t.id !== taskId)
      updateTasks(newTasks)
      // focus previous
      const prevId = item.tasks[idx - 1]?.id
      if (prevId) setTimeout(() => rowRefs.current[prevId]?.focus(), 0)
    }
  }, [item.tasks, updateTasks])

  return (
    <div className={styles.card}>
      <div className={styles.dragHandle} />
      <div className={styles.list}>
        {item.tasks.map((task, idx) => (
          <div key={task.id} className={styles.row}>
            <button
              className={`${styles.check} ${task.completed ? styles.done : ''}`}
              onClick={e => { e.stopPropagation(); toggleTask(task.id) }}
              onMouseDown={e => e.stopPropagation()}
              title={task.completed ? 'Označit jako nesplněný' : 'Splněno'}
            >
              {task.completed && (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <input
              ref={el => { rowRefs.current[task.id] = el }}
              className={`${styles.taskText} ${task.completed ? styles.strikethrough : ''}`}
              value={task.text}
              placeholder="Úkol..."
              onChange={e => updateTaskText(task.id, e.target.value)}
              onKeyDown={e => handleKeyDown(e, task.id, idx)}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            />

            <button
              className={styles.dot}
              style={{
                background: PRIORITY_COLORS[task.priority],
                borderColor: task.priority === 'none' ? 'rgba(232,227,216,0.2)' : PRIORITY_COLORS[task.priority],
              }}
              onClick={e => cyclePriority(task.id, e)}
              onMouseDown={e => e.stopPropagation()}
              title={`Priorita: ${task.priority}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
