import { ReflectionItem, ConnectionPoint, Connection } from './types'
import { LAYOUT } from './constants'

export function getPointPosition(
  items: ReflectionItem[],
  itemId: string,
  point: ConnectionPoint
): { x: number; y: number } {
  const item = items.find(i => i.id === itemId)
  if (!item) return { x: 0, y: 0 }

  // DOMから接続ポイントの実際の位置を取得
  const dotElement = document.querySelector(
    `[data-connection-point="${itemId}-${point}"]`
  ) as HTMLElement
  const boardElement = document.querySelector('[data-board]') as HTMLElement

  if (dotElement && boardElement) {
    const dotRect = dotElement.getBoundingClientRect()
    const boardRect = boardElement.getBoundingClientRect()

    return {
      x: dotRect.left - boardRect.left + dotRect.width / 2,
      y: dotRect.top - boardRect.top + dotRect.height / 2,
    }
  }

  // フォールバック: 計算で求める
  const width = LAYOUT.STICKY_WIDTH
  const element = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement
  const height = element?.offsetHeight || LAYOUT.STICKY_HEIGHT
  const centerX = item.x + width / 2
  const centerY = item.y + height / 2

  switch (point) {
    case 'top':
      return { x: centerX, y: item.y }
    case 'right':
      return { x: item.x + width, y: centerY }
    case 'bottom':
      return { x: centerX, y: item.y + height }
    case 'left':
      return { x: item.x, y: centerY }
  }
}

export function getConnectionPath(items: ReflectionItem[], conn: Connection): string {
  const start = getPointPosition(items, conn.from, conn.fromPoint)
  const end = getPointPosition(items, conn.to, conn.toPoint)

  const dx = end.x - start.x
  const dy = end.y - start.y

  // 直角に曲がる線（Miroスタイル）
  if (Math.abs(dx) > Math.abs(dy)) {
    const midX = start.x + dx / 2
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
  } else {
    const midY = start.y + dy / 2
    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
  }
}

export function autoResizeTextarea(element: HTMLTextAreaElement): void {
  element.style.height = '0px'
  element.style.height = Math.max(element.scrollHeight, 80) + 'px'
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('ja-JP', options)
}

export function highlightText(text: string, keyword: string): string {
  if (!keyword) return text
  return text.replace(
    new RegExp(`(${keyword})`, 'gi'),
    '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
  )
}
