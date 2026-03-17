import type { CanvasTransform } from '../store/types'

export const TOOLBAR_HEIGHT = 48

export function screenToCanvas(screenX: number, screenY: number, t: CanvasTransform) {
  return {
    x: (screenX - t.x) / t.scale,
    y: (screenY - t.y) / t.scale,
  }
}

export function canvasToScreen(canvasX: number, canvasY: number, t: CanvasTransform) {
  return {
    x: canvasX * t.scale + t.x,
    y: canvasY * t.scale + t.y,
  }
}

export function getViewportCenter(t: CanvasTransform) {
  const screenCenterX = window.innerWidth / 2
  const screenCenterY = (window.innerHeight - TOOLBAR_HEIGHT) / 2
  return screenToCanvas(screenCenterX, screenCenterY, t)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getInitialTransform(): CanvasTransform {
  return {
    x: window.innerWidth / 2,
    y: (window.innerHeight - TOOLBAR_HEIGHT) / 2,
    scale: 1,
  }
}

/**
 * Returns the point on the border of rectangle (rx,ry,rw,rh) that lies on the
 * ray from the rectangle's center toward (fromX, fromY).
 * Use this to find where an arrow should attach to an item's edge.
 */
export function getEdgePoint(
  fromX: number, fromY: number,
  rx: number, ry: number, rw: number, rh: number,
): { x: number; y: number } {
  const cx = rx + rw / 2
  const cy = ry + rh / 2
  const dx = fromX - cx
  const dy = fromY - cy
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return { x: cx, y: cy }
  const sx = dx !== 0 ? (rw / 2) / Math.abs(dx) : Infinity
  const sy = dy !== 0 ? (rh / 2) / Math.abs(dy) : Infinity
  const s  = Math.min(sx, sy)
  return { x: cx + dx * s, y: cy + dy * s }
}
