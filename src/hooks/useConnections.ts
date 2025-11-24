import { useState, useCallback, useEffect } from 'react'
import { Connection, ConnectionPoint } from '@/lib/types'
import { getPointPosition } from '@/lib/geometry'
import { ReflectionItem } from '@/lib/types'

export function useConnections(items: ReflectionItem[]) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [connectingFrom, setConnectingFrom] = useState<{
    itemId: string
    point: ConnectionPoint
  } | null>(null)
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{
    itemId: string
    point: ConnectionPoint
  } | null>(null)

  const startConnection = useCallback(
    (itemId: string, point: ConnectionPoint) => {
      setConnectingFrom({ itemId, point })
      const pos = getPointPosition(items, itemId, point)
      setConnectionPreview(pos)
    },
    [items]
  )

  const completeConnection = useCallback(
    (toId: string, toPoint: ConnectionPoint) => {
      if (connectingFrom && connectingFrom.itemId !== toId) {
        const newConnection: Connection = {
          id: Date.now().toString(),
          from: connectingFrom.itemId,
          fromPoint: connectingFrom.point,
          to: toId,
          toPoint: toPoint,
        }
        setConnections(prev => [...prev, newConnection])
      }
      setConnectingFrom(null)
      setConnectionPreview(null)
    },
    [connectingFrom]
  )

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
  }, [])

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null)
    setConnectionPreview(null)
  }, [])

  const deleteItemConnections = useCallback((itemId: string) => {
    setConnections(prev => prev.filter(conn => conn.from !== itemId && conn.to !== itemId))
  }, [])

  const handleConnectionMouseMove = useCallback(
    (e: MouseEvent) => {
      if (connectingFrom) {
        setConnectionPreview({ x: e.clientX, y: e.clientY - 73 })
      }
    },
    [connectingFrom]
  )

  useEffect(() => {
    if (connectingFrom) {
      document.addEventListener('mousemove', handleConnectionMouseMove)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') cancelConnection()
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousemove', handleConnectionMouseMove)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [connectingFrom, handleConnectionMouseMove, cancelConnection])

  return {
    connections,
    setConnections,
    connectingFrom,
    connectionPreview,
    hoveredPoint,
    setHoveredPoint,
    startConnection,
    completeConnection,
    deleteConnection,
    cancelConnection,
    deleteItemConnections,
  }
}
