import { useClock } from '../../hooks/useClock'
import styles from './Toolbar.module.css'

export function ClockDisplay() {
  const { dateStr, timeStr } = useClock()
  return (
    <div className={styles.clock}>
      <span className={styles.clockDate}>{dateStr}</span>
      <span className={styles.clockTime}>{timeStr}</span>
    </div>
  )
}
