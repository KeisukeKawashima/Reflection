import { ReflectionItem, ConnectionPoint } from '@/lib/types'
import { autoResizeTextarea } from '@/lib/geometry'
import { COLORS } from '@/lib/constants'

interface StickyNoteProps {
  item: ReflectionItem
  isSelected: boolean
  isDragging: boolean
  isConnecting: boolean
  connections: Array<{ from: string; to: string; fromPoint: string; toPoint: string }>
  hoveredPoint: { itemId: string; point: ConnectionPoint } | null
  onMouseDown: (e: React.MouseEvent) => void
  onClick: () => void
  onUpdate: (text: string) => void
  onDelete: () => void
  onStartConnection: (e: React.MouseEvent, point: ConnectionPoint) => void
  onCompleteConnection: (point: ConnectionPoint) => void
  onHoverPoint: (point: ConnectionPoint | null) => void
}

const CONNECTION_POINTS: ConnectionPoint[] = ['top', 'right', 'bottom', 'left']

export function StickyNote({
  item,
  isSelected,
  isDragging,
  isConnecting,
  connections,
  hoveredPoint,
  onMouseDown,
  onClick,
  onUpdate,
  onDelete,
  onStartConnection,
  onCompleteConnection,
  onHoverPoint,
}: StickyNoteProps) {
  const colors = item.type === 'good' ? COLORS.GOOD : COLORS.GROWTH

  const getPositionClass = (point: ConnectionPoint) =>
    ({
      top: 'left-1/2 -top-2 -translate-x-1/2',
      right: '-right-2 top-1/2 -translate-y-1/2',
      bottom: 'left-1/2 -bottom-2 -translate-x-1/2',
      left: '-left-2 top-1/2 -translate-y-1/2',
    })[point]

  return (
    <div
      data-item-id={item.id}
      className={`group/item absolute w-56 cursor-move select-none rounded-lg border-2 p-4 ${
        colors.bg
      } text-gray-900 ${colors.border} ${
        isDragging ? 'z-50 shadow-2xl' : 'shadow-md transition-all hover:shadow-lg'
      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${
        isConnecting ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      style={{ left: item.x, top: item.y }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {CONNECTION_POINTS.map(point => {
        const isHovered = hoveredPoint?.itemId === item.id && hoveredPoint?.point === point
        const isConnected = connections.some(
          c =>
            (c.from === item.id && c.fromPoint === point) ||
            (c.to === item.id && c.toPoint === point)
        )

        return (
          <div
            key={point}
            data-connection-point={`${item.id}-${point}`}
            className={`connection-dot absolute z-20 h-3 w-3 transform cursor-pointer rounded-full border-2 border-blue-500 bg-white transition-all ${getPositionClass(
              point
            )} ${isConnected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} ${
              isHovered ? 'scale-150 bg-blue-500' : ''
            }`}
            onMouseDown={e => e.stopPropagation()}
            onMouseEnter={() => onHoverPoint(point)}
            onMouseLeave={() => onHoverPoint(null)}
            onClick={e => {
              e.stopPropagation()
              if (isConnecting) {
                onCompleteConnection(point)
              } else {
                onStartConnection(e, point)
              }
            }}
          />
        )
      })}

      <div className="mb-2 flex items-start justify-between">
        <span className={`text-xs font-medium ${colors.text}`}>
          {item.type === 'good' ? '✓ 良かったこと' : '→ 改善したいこと'}
        </span>
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className="flex h-5 w-5 items-center justify-center rounded text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          title="削除 (Delete)"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <textarea
        value={item.text}
        onChange={e => {
          onUpdate(e.target.value)
          setTimeout(() => autoResizeTextarea(e.target), 0)
        }}
        className="block w-full resize-none break-words border-none bg-transparent text-sm placeholder-gray-400 outline-none"
        placeholder="入力してください..."
        onMouseDown={e => e.stopPropagation()}
        style={{
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          overflow: 'hidden',
        }}
      />
    </div>
  )
}
