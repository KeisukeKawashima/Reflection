import { Connection, ReflectionItem, ConnectionPoint } from '@/lib/types'
import { getConnectionPath, getPointPosition } from '@/lib/geometry'

interface ConnectionLayerProps {
  connections: Connection[]
  items: ReflectionItem[]
  connectingFrom: { itemId: string; point: ConnectionPoint } | null
  connectionPreview: { x: number; y: number } | null
  onDeleteConnection: (id: string) => void
}

export function ConnectionLayer({
  connections,
  items,
  connectingFrom,
  connectionPreview,
  onDeleteConnection,
}: ConnectionLayerProps) {
  const startPos = connectingFrom
    ? getPointPosition(items, connectingFrom.itemId, connectingFrom.point)
    : { x: 0, y: 0 }

  return (
    <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#2563eb" />
        </marker>
        <marker
          id="arrowhead-hover"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#ef4444" />
        </marker>
      </defs>

      {connections.map(conn => (
        <g
          key={conn.id}
          className="group/conn pointer-events-auto cursor-pointer"
          onClick={() => onDeleteConnection(conn.id)}
        >
          <path
            d={getConnectionPath(items, conn)}
            stroke="transparent"
            strokeWidth="12"
            fill="none"
          />
          <path
            d={getConnectionPath(items, conn)}
            stroke="#2563eb"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="transition-colors group-hover/conn:stroke-red-500"
          />
        </g>
      ))}

      {connectingFrom && connectionPreview && (
        <line
          x1={startPos.x}
          y1={startPos.y}
          x2={connectionPreview.x}
          y2={connectionPreview.y}
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="8,4"
          className="pointer-events-none"
        />
      )}
    </svg>
  )
}
