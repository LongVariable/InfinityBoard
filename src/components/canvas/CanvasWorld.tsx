import type { ReactNode } from 'react'
import type { CanvasTransform } from '../../store/types'

interface CanvasWorldProps {
  transform: CanvasTransform
  children: ReactNode
}

export function CanvasWorld({ transform, children }: CanvasWorldProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        transformOrigin: '0 0',
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
