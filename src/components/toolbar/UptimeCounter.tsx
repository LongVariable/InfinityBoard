import { useUptime } from '../../hooks/useUptime'
import styles from './Toolbar.module.css'

export function UptimeCounter() {
  const uptime = useUptime()
  return (
    <span className={styles.uptime} title="Doba běhu od spuštění">
      {uptime}
    </span>
  )
}
