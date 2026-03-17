import { useEffect, useRef, useState } from 'react'

export function useUptime() {
  const startTime = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime.current)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const totalSeconds = Math.floor(elapsed / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
