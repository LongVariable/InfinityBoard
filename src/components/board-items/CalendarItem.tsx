import { useCallback, useState } from 'react'
import type { CalendarItem } from '../../store/types'
import { useBoardStore } from '../../store/boardStore'
import styles from './CalendarItem.module.css'

const DAYS   = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne']
const MONTHS = ['Leden','Unor','Brezen','Duben','Kveten','Cerven',
                'Cervenec','Srpen','Zari','Rijen','Listopad','Prosinec']

interface Props { item: CalendarItem }

export function CalendarItemComp({ item }: Props) {
  const updateItem = useBoardStore(s => s.updateItem)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const navigate = useCallback((delta: number) => {
    let month = item.viewMonth + delta
    let year  = item.viewYear
    if (month > 11) { month = 0; year++ }
    if (month < 0)  { month = 11; year-- }
    updateItem(item.id, { viewMonth: month, viewYear: year } as Partial<CalendarItem>)
  }, [item.id, item.viewMonth, item.viewYear, updateItem])

  const toggleDate = useCallback((dateStr: string) => {
    const marked = item.markedDates.includes(dateStr)
      ? item.markedDates.filter(d => d !== dateStr)
      : [...item.markedDates, dateStr]
    updateItem(item.id, { markedDates: marked } as Partial<CalendarItem>)
  }, [item.id, item.markedDates, updateItem])

  const updateNote = useCallback((dateStr: string, text: string) => {
    updateItem(item.id, { notes: { ...item.notes, [dateStr]: text } } as Partial<CalendarItem>)
  }, [item.id, item.notes, updateItem])

  const firstDay    = new Date(item.viewYear, item.viewMonth, 1).getDay()
  const offset      = (firstDay + 6) % 7
  const daysInMonth = new Date(item.viewYear, item.viewMonth + 1, 0).getDate()
  const today       = new Date()

  const cells: Array<number | null> = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const fmtDate = (d: number) =>
    `${item.viewYear}-${String(item.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className={styles.card}>
      <div className={styles.dragSpace} />
      <div className={styles.inner}>
        {/* LEFT: calendar grid */}
        <div className={styles.calLeft}>
          <div className={styles.header}>
            <button className={styles.navBtn}
              onClick={e => { e.stopPropagation(); navigate(-1) }}
              onMouseDown={e => e.stopPropagation()}>
              &lsaquo;
            </button>
            <span className={styles.monthLabel}>
              {MONTHS[item.viewMonth]} {item.viewYear}
            </span>
            <button className={styles.navBtn}
              onClick={e => { e.stopPropagation(); navigate(1) }}
              onMouseDown={e => e.stopPropagation()}>
              &rsaquo;
            </button>
          </div>
          <div className={styles.grid}>
            {DAYS.map(d => <div key={d} className={styles.dayName}>{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const ds      = fmtDate(day)
              const isToday = day === today.getDate() && item.viewMonth === today.getMonth() && item.viewYear === today.getFullYear()
              const marked  = item.markedDates.includes(ds)
              const sel     = selectedDate === ds
              return (
                <button key={day}
                  className={[styles.day, isToday ? styles.today : '', marked ? styles.marked : '', sel ? styles.selected : ''].join(' ')}
                  onClick={e => { e.stopPropagation(); setSelectedDate(sel ? null : ds); toggleDate(ds) }}
                  onMouseDown={e => e.stopPropagation()}>
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* DIVIDER */}
        <div className={styles.divider} />

        {/* RIGHT: notes */}
        <div className={styles.notes}>
          {selectedDate ? (
            <>
              <div className={styles.notesDate}>{selectedDate.split('-').reverse().join('. ')}</div>
              <textarea
                className={styles.notesArea}
                value={item.notes[selectedDate] ?? ''}
                onChange={e => updateNote(selectedDate, e.target.value)}
                placeholder="Poznamky k tomuto dni..."
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
              />
            </>
          ) : (
            <span className={styles.notesHint}>Vyber den</span>
          )}
        </div>
      </div>
    </div>
  )
}
