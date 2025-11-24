import { useState, useEffect } from 'react'
import { ReflectionItem, ConnectionPoint } from '@/lib/types'
import { StickyNote } from './StickyNote'
import { ConnectionLayer } from './ConnectionLayer'
import { Toolbar } from './Toolbar'
import { LAYOUT, ANIMATION } from '@/lib/constants'
import { autoResizeTextarea } from '@/lib/geometry'

interface ReflectionBoardProps {
  items: ReflectionItem[]
  selectedItem: string | null
  connections: any[]
  connectingFrom: any
  connectionPreview: any
  hoveredPoint: any
  onAddItem: (type: 'good' | 'growth') => void
  onUpdateItem: (id: string, text: string) => void
  onMoveItem: (id: string, x: number, y: number) => void
  onDeleteItem: (id: string) => void
  onSelectItem: (id: string) => void
  onStartConnection: (itemId: string, point: ConnectionPoint) => void
  onCompleteConnection: (itemId: string, point: ConnectionPoint) => void
  onDeleteConnection: (id: string) => void
  onHoverPoint: (point: { itemId: string; point: ConnectionPoint } | null) => void
  onNext: () => void
}

export function ReflectionBoard({
  items,
  selectedItem,
  connections,
  connectingFrom,
  connectionPreview,
  hoveredPoint,
  onAddItem,
  onUpdateItem,
  onMoveItem,
  onDeleteItem,
  onSelectItem,
  onStartConnection,
  onCompleteConnection,
  onDeleteConnection,
  onHoverPoint,
  onNext,
}: ReflectionBoardProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, ANIMATION.WELCOME_TIMEOUT)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(textarea => {
      if (textarea instanceof HTMLTextAreaElement) {
        autoResizeTextarea(textarea)
      }
    })
  }, [items])

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if (!(e.target as HTMLElement).classList.contains('connection-dot')) {
      setDraggedItem(itemId)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - LAYOUT.STICKY_OFFSET_X
    const y = e.clientY - rect.top - LAYOUT.STICKY_OFFSET_Y

    onMoveItem(
      draggedItem,
      Math.max(0, Math.min(x, rect.width - LAYOUT.STICKY_WIDTH)),
      Math.max(0, Math.min(y, rect.height - LAYOUT.STICKY_HEIGHT))
    )
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  const filledItemsCount = items.filter(item => item.text.trim()).length

  return (
    <div>
      <Toolbar onAddGood={() => onAddItem('good')} onAddGrowth={() => onAddItem('growth')} />

      <div
        data-board
        className="fixed inset-0 top-[73px] overflow-hidden bg-gray-50"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ConnectionLayer
          connections={connections}
          items={items}
          connectingFrom={connectingFrom}
          connectionPreview={connectionPreview}
          onDeleteConnection={onDeleteConnection}
        />

        {showWelcome && items.length === 0 && (
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center bg-gray-50 transition-opacity duration-1000 ${
              showWelcome ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="animate-fade-in text-center">
              <p className="text-2xl font-light text-gray-700">
                今日を振り返り問題発見して生きましょう
              </p>
            </div>
          </div>
        )}

        {items.map(item => (
          <StickyNote
            key={item.id}
            item={item}
            isSelected={selectedItem === item.id}
            isDragging={draggedItem === item.id}
            isConnecting={connectingFrom?.itemId === item.id}
            connections={connections}
            hoveredPoint={hoveredPoint}
            onMouseDown={e => handleMouseDown(e, item.id)}
            onClick={() => !connectingFrom && onSelectItem(item.id)}
            onUpdate={text => onUpdateItem(item.id, text)}
            onDelete={() => onDeleteItem(item.id)}
            onStartConnection={(e, point) => {
              e.stopPropagation()
              onStartConnection(item.id, point)
            }}
            onCompleteConnection={point => {
              if (connectingFrom?.itemId !== item.id) {
                onCompleteConnection(item.id, point)
              }
            }}
            onHoverPoint={point => {
              if (connectingFrom) {
                onHoverPoint(point ? { itemId: item.id, point } : null)
              }
            }}
          />
        ))}

        {items.length === 0 && !showWelcome && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-300">
              <p className="mb-2 text-base">付箋を追加して始めましょう</p>
              <p className="text-xs text-gray-400">左のボタンから追加できます</p>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="fixed bottom-6 left-6 z-10 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-400 backdrop-blur-sm">
            <p>💡 ホバーして青いドットをドラッグで接続 | Delete で削除 | Ctrl+C/V でコピー</p>
          </div>
        )}

        {connectingFrom && (
          <div className="fixed left-1/2 top-20 z-20 -translate-x-1/2 transform rounded-lg bg-blue-500 px-4 py-2 text-sm text-white shadow-lg">
            接続先の付箋をクリック | Escでキャンセル
          </div>
        )}
      </div>

      {filledItemsCount > 0 && (
        <div className="fixed bottom-6 right-6 z-20">
          <button
            onClick={onNext}
            className="flex items-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl"
          >
            次へ進む
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
