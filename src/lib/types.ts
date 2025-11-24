export interface ReflectionItem {
  id: string
  text: string
  type: 'good' | 'growth'
  x: number
  y: number
}

export type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left'

export interface Connection {
  id: string
  from: string
  fromPoint: ConnectionPoint
  to: string
  toPoint: ConnectionPoint
  label?: string
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
}

export interface DailyRecord {
  date: string
  items: ReflectionItem[]
  selectedItem: ReflectionItem | null
  chatMessages: ChatMessage[]
}

export type Step = 'input' | 'select' | 'chat' | 'history'

export class Position {
  constructor(
    public x: number,
    public y: number
  ) {}

  offset(dx: number, dy: number): Position {
    return new Position(this.x + dx, this.y + dy)
  }

  constrain(maxX: number, maxY: number): Position {
    return new Position(Math.max(0, Math.min(this.x, maxX)), Math.max(0, Math.min(this.y, maxY)))
  }
}
