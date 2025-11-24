'use client'
import { useState, useEffect } from 'react'

interface ReflectionItem {
  id: string
  text: string
  type: 'good' | 'growth'
  x: number
  y: number
}

type ConnectionPoint = 'top' | 'right' | 'bottom' | 'left'

interface Connection {
  id: string
  from: string
  fromPoint: ConnectionPoint
  to: string
  toPoint: ConnectionPoint
  label?: string
}

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
}

interface DailyRecord {
  date: string
  items: ReflectionItem[]
  selectedItem: ReflectionItem | null
  chatMessages: ChatMessage[]
}

type Step = 'input' | 'select' | 'chat' | 'history'

export default function ReflectionApp() {
  const [step, setStep] = useState<Step>('input')
  const [items, setItems] = useState<ReflectionItem[]>([])
  const [selectedTopic, setSelectedTopic] = useState<ReflectionItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<ReflectionItem | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isAiTyping, setIsAiTyping] = useState(false)
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
  const [editingConnection, setEditingConnection] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const loadRecords = async () => {
    try {
      const response = await fetch('/api/reflections')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }

  const saveRecord = async () => {
    try {
      await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          items: items.filter(item => item.text.trim()),
          selectedItem,
          chatMessages,
        }),
      })
    } catch (error) {
      console.error('Failed to save record:', error)
    }
  }

  const resumeFromHistory = (record: any) => {
    setItems(record.items || [])
    setStep('select')
  }

  const resumeConversation = (record: any) => {
    setItems(record.items || [])
    setSelectedItem(record.selectedItem || null)
    setChatMessages(record.chatMessages || [])
    setStep('chat')
  }

  const deleteRecord = async (date: string) => {
    setShowDeleteModal(null)
    setDeletingRecord(date)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      await fetch(`/api/reflections/${date}`, { method: 'DELETE' })
      setRecords(records.filter(r => r.date !== date))
    } catch (error) {
      console.error('Failed to delete record:', error)
    } finally {
      setDeletingRecord(null)
    }
  }

  // 検索とフィルタリング
  const filteredRecords = records.filter(record => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      record.items.some((item: any) => item.text.toLowerCase().includes(keyword)) ||
      (record.selectedItem && record.selectedItem.text.toLowerCase().includes(keyword)) ||
      record.chatMessages.some((msg: any) => msg.text.toLowerCase().includes(keyword))
    )
  })

  // 年月でグループ化
  const groupedRecords = filteredRecords.reduce((groups: any, record) => {
    const yearMonth = record.date.substring(0, 7) // YYYY-MM
    if (!groups[yearMonth]) {
      groups[yearMonth] = []
    }
    groups[yearMonth].push(record)
    return groups
  }, {})

  useEffect(() => {
    loadRecords()

    // ウェルカムメッセージを3秒後にフェードアウト
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // 接続線のマウス移動とキャンセル
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
  }, [connectingFrom])

  useEffect(() => {
    // 全てのtextareaの高さを調整
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(textarea => {
      if (textarea instanceof HTMLTextAreaElement) {
        autoResizeTextarea(textarea)
      }
    })
  }, [items])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // テキスト入力中は無視
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return
      }

      // Ctrl/Cmd + C でコピー
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedItem) {
        e.preventDefault()
        const item = items.find(i => i.id === selectedItem)
        if (item) {
          setCopiedItem(item)
        }
      }

      // Ctrl/Cmd + V でペースト
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedItem) {
        e.preventDefault()
        const newItem: ReflectionItem = {
          id: Date.now().toString(),
          text: copiedItem.text,
          type: copiedItem.type,
          x: Math.min(copiedItem.x + 20, 600),
          y: Math.min(copiedItem.y + 20, 480),
        }
        setItems([...items, newItem])
      }

      // Delete/Backspace で削除
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault()
        deleteItem(selectedItem)
        setSelectedItem(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, copiedItem, items])

  const addItem = (type: 'good' | 'growth') => {
    const newItem: ReflectionItem = {
      id: Date.now().toString(),
      text: '',
      type,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, text: string) => {
    setItems(items.map(item => (item.id === id ? { ...item, text } : item)))
  }

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = '0px'
    element.style.height = Math.max(element.scrollHeight, 80) + 'px'
  }

  const moveItem = (id: string, x: number, y: number) => {
    setItems(items.map(item => (item.id === id ? { ...item, x, y } : item)))
  }

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - 96 // 付箋幅の半分
    const y = e.clientY - rect.top - 56 // 付箋高さの半分

    moveItem(
      draggedItem,
      Math.max(0, Math.min(x, rect.width - 192)),
      Math.max(0, Math.min(y, rect.height - 112))
    )
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  // 接続ポイントの座標を取得（DOMから実際の位置を取得）
  const getPointPosition = (itemId: string, point: ConnectionPoint) => {
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

      // ボード内での相対座標を計算
      return {
        x: dotRect.left - boardRect.left + dotRect.width / 2,
        y: dotRect.top - boardRect.top + dotRect.height / 2,
      }
    }

    // フォールバック: 計算で求める
    const width = 224
    const element = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement
    const height = element?.offsetHeight || 112
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

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    // 関連する接続も削除
    setConnections(connections.filter(conn => conn.from !== id && conn.to !== id))
  }

  const startConnection = (e: React.MouseEvent, itemId: string, point: ConnectionPoint) => {
    e.stopPropagation()
    e.preventDefault()
    setConnectingFrom({ itemId, point })
    const pos = getPointPosition(itemId, point)
    setConnectionPreview(pos)
  }

  const completeConnection = (toId: string, toPoint: ConnectionPoint) => {
    if (connectingFrom && connectingFrom.itemId !== toId) {
      const newConnection: Connection = {
        id: Date.now().toString(),
        from: connectingFrom.itemId,
        fromPoint: connectingFrom.point,
        to: toId,
        toPoint: toPoint,
      }
      setConnections([...connections, newConnection])
    }
    setConnectingFrom(null)
    setConnectionPreview(null)
  }

  const deleteConnection = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId))
    setEditingConnection(null)
  }

  const handleConnectionMouseMove = (e: MouseEvent) => {
    if (connectingFrom) {
      // ヘッダーの高さ（73px）を引いてSVG座標に変換
      setConnectionPreview({ x: e.clientX, y: e.clientY - 73 })
    }
  }

  const cancelConnection = () => {
    setConnectingFrom(null)
    setConnectionPreview(null)
  }

  const copyItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const newItem: ReflectionItem = {
      id: Date.now().toString(),
      text: item.text,
      type: item.type,
      x: item.x + 20,
      y: item.y + 20,
    }
    setItems([...items, newItem])
  }

  // 矢印の座標を計算（Miroスタイル - ポイント間接続）
  const getConnectionPath = (conn: Connection) => {
    const start = getPointPosition(conn.from, conn.fromPoint)
    const end = getPointPosition(conn.to, conn.toPoint)

    const dx = end.x - start.x
    const dy = end.y - start.y

    // 直角に曲がる線（Miroスタイル）
    if (Math.abs(dx) > Math.abs(dy)) {
      // 横方向が主
      const midX = start.x + dx / 2
      return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
    } else {
      // 縦方向が主
      const midY = start.y + dy / 2
      return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
    }
  }

  const selectItemForReflection = (item: ReflectionItem) => {
    setSelectedTopic(item)
    setStep('chat')

    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `「${item.text}」について振り返りたいのですね。なぜこの点について深く考えたいと思ったのでしょうか？`,
      sender: 'ai',
    }
    setChatMessages([initialMessage])
    setTimeout(() => saveRecord(), 100)
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isAiTyping) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
    }

    setChatMessages(prev => {
      const newMessages = [...prev, userMessage]
      setTimeout(() => saveRecord(), 50)
      return newMessages
    })

    const messageCount = chatMessages.length
    const messageText = currentMessage
    setCurrentMessage('')
    setIsAiTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          selectedTopic: selectedTopic?.text,
          messageCount,
        }),
      })

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai',
      }

      setChatMessages(prev => {
        const newMessages = [...prev, aiMessage]
        setTimeout(() => saveRecord(), 100)
        return newMessages
      })
    } catch (error) {
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'その視点は興味深いですね。もう少し詳しく教えてください。',
        sender: 'ai',
      }
      setChatMessages(prev => {
        const newMessages = [...prev, fallbackMessage]
        setTimeout(() => saveRecord(), 100)
        return newMessages
      })
    } finally {
      setIsAiTyping(false)
    }
  }

  const goToNextStep = () => {
    const filledItems = items.filter(item => item.text.trim())
    if (filledItems.length === 0) {
      alert('まずは良かったことや伸び代に感じたことを入力してください')
      return
    }
    if (step === 'input') {
      setStep('select')
    }
  }

  const goBack = () => {
    if (step === 'select') {
      setStep('input')
    } else if (step === 'chat') {
      setStep('select')
      setChatMessages([])
      setSelectedTopic(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-full">
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <h1
                className="cursor-pointer text-lg font-medium text-gray-900 transition-colors hover:text-gray-700"
                onClick={() => {
                  setStep('input')
                  setItems([])
                  setSelectedItem(null)
                  setChatMessages([])
                }}
              >
                今日の振り返り
              </h1>
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep('history')}
                className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
                title="履歴"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {step !== 'input' && (
                <button
                  onClick={() => {
                    setStep('input')
                    setItems([])
                    setSelectedItem(null)
                    setChatMessages([])
                  }}
                  className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
                  title="新しく始める"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {step === 'input' && (
            <div>
              {/* ツールバー - 左中央固定 */}
              <div className="fixed left-6 top-1/2 z-20 flex -translate-y-1/2 transform flex-col space-y-2">
                <button
                  onClick={() => addItem('good')}
                  className="group flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
                  title="良かったこと"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 transition-colors group-hover:bg-green-200">
                    <svg
                      className="h-4 w-4 text-green-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">良かったこと</span>
                </button>
                <button
                  onClick={() => addItem('growth')}
                  className="group flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
                  title="改善したいこと"
                >
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 transition-colors group-hover:bg-blue-200">
                    <svg
                      className="h-4 w-4 text-blue-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">改善したいこと</span>
                </button>
              </div>

              {/* ボード */}
              <div
                data-board
                className="fixed inset-0 top-[73px] overflow-hidden bg-gray-50"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 接続線（SVG） */}
                <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
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
                      onClick={() => deleteConnection(conn.id)}
                    >
                      {/* 太い透明な線（クリック領域を広げる） */}
                      <path
                        d={getConnectionPath(conn)}
                        stroke="transparent"
                        strokeWidth="12"
                        fill="none"
                      />
                      {/* 実際の線 */}
                      <path
                        d={getConnectionPath(conn)}
                        stroke="#2563eb"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="transition-colors group-hover/conn:stroke-red-500"
                      />
                    </g>
                  ))}
                  {/* 接続中のプレビュー線 */}
                  {connectingFrom && connectionPreview && (
                    <line
                      x1={getPointPosition(connectingFrom.itemId, connectingFrom.point).x}
                      y1={getPointPosition(connectingFrom.itemId, connectingFrom.point).y}
                      x2={connectionPreview.x}
                      y2={connectionPreview.y}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      className="pointer-events-none"
                    />
                  )}
                </svg>

                {/* ウェルカムメッセージ */}
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

                {/* 付箋 */}
                {items.map(item => (
                  <div
                    key={item.id}
                    data-item-id={item.id}
                    className={`group/item absolute w-56 cursor-move select-none rounded-lg border-2 p-4 ${
                      item.type === 'good'
                        ? 'border-green-300 bg-green-100 text-gray-900'
                        : 'border-blue-300 bg-blue-100 text-gray-900'
                    } ${draggedItem === item.id ? 'z-50 shadow-2xl' : 'shadow-md transition-all hover:shadow-lg'} ${
                      selectedItem === item.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${connectingFrom?.itemId === item.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    style={{ left: item.x, top: item.y }}
                    onMouseDown={e => {
                      // 接続ドット以外でドラッグ開始
                      if (!(e.target as HTMLElement).classList.contains('connection-dot')) {
                        handleMouseDown(e, item.id)
                      }
                    }}
                    onClick={e => {
                      if (!connectingFrom) {
                        setSelectedItem(item.id)
                      }
                    }}
                  >
                    {/* 接続ポイント（Miroスタイル - 4方向） */}
                    {(['top', 'right', 'bottom', 'left'] as ConnectionPoint[]).map(point => {
                      const isHovered =
                        hoveredPoint?.itemId === item.id && hoveredPoint?.point === point
                      const isConnected = connections.some(
                        c =>
                          (c.from === item.id && c.fromPoint === point) ||
                          (c.to === item.id && c.toPoint === point)
                      )
                      const positionClass = {
                        top: 'left-1/2 -top-2 -translate-x-1/2',
                        right: '-right-2 top-1/2 -translate-y-1/2',
                        bottom: 'left-1/2 -bottom-2 -translate-x-1/2',
                        left: '-left-2 top-1/2 -translate-y-1/2',
                      }[point]

                      return (
                        <div
                          key={point}
                          data-connection-point={`${item.id}-${point}`}
                          className={`connection-dot absolute z-20 h-3 w-3 transform cursor-pointer rounded-full border-2 border-blue-500 bg-white transition-all ${positionClass} ${
                            isConnected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                          } ${isHovered || (connectingFrom && hoveredPoint?.itemId === item.id && hoveredPoint?.point === point) ? 'scale-150 bg-blue-500' : ''}`}
                          onMouseDown={e => {
                            e.stopPropagation()
                          }}
                          onMouseEnter={() => {
                            if (connectingFrom) {
                              setHoveredPoint({ itemId: item.id, point })
                            }
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={e => {
                            e.stopPropagation()
                            if (connectingFrom) {
                              if (connectingFrom.itemId !== item.id) {
                                completeConnection(item.id, point)
                              }
                            } else {
                              startConnection(e, item.id, point)
                            }
                          }}
                        />
                      )
                    })}

                    <div className="mb-2 flex items-start justify-between">
                      <span
                        className={`text-xs font-medium ${
                          item.type === 'good' ? 'text-green-700' : 'text-blue-700'
                        }`}
                      >
                        {item.type === 'good' ? '✓ 良かったこと' : '→ 改善したいこと'}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteItem(item.id)
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="削除 (Delete)"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                        updateItem(item.id, e.target.value)
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
                ))}

                {/* 空の状態（ウェルカムメッセージが消えた後） */}
                {items.length === 0 && !showWelcome && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-300">
                      <p className="mb-2 text-base">付箋を追加して始めましょう</p>
                      <p className="text-xs text-gray-400">左のボタンから追加できます</p>
                    </div>
                  </div>
                )}

                {/* ヘルプテキスト */}
                {items.length > 0 && (
                  <div className="fixed bottom-6 left-6 z-10 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-400 backdrop-blur-sm">
                    <p>
                      💡 ホバーして青いドットをドラッグで接続 | Delete で削除 | Ctrl+C/V でコピー
                    </p>
                  </div>
                )}

                {/* 接続中のヒント */}
                {connectingFrom && (
                  <div className="fixed left-1/2 top-20 z-20 -translate-x-1/2 transform rounded-lg bg-blue-500 px-4 py-2 text-sm text-white shadow-lg">
                    接続先の付箋をクリック | Escでキャンセル
                  </div>
                )}
              </div>

              {/* 次へ進むボタン - 右下固定 */}
              {items.filter(item => item.text.trim()).length > 0 && (
                <div className="fixed bottom-6 right-6 z-20">
                  <button
                    onClick={goToNextStep}
                    className="flex items-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl"
                  >
                    次へ進む
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'select' && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-xl font-medium text-gray-900">
                  どれについて深く考えてみますか？
                </h2>
                <p className="text-sm text-gray-500">一つ選んでAIと対話してみましょう</p>
              </div>

              <div className="space-y-2">
                {items
                  .filter(item => item.text.trim())
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => selectItemForReflection(item)}
                      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="mr-4 flex-1">
                          <div className="mb-1 flex items-center">
                            <span
                              className={`mr-2 text-xs font-medium ${
                                item.type === 'good' ? 'text-green-600' : 'text-blue-600'
                              }`}
                            >
                              {item.type === 'good' ? '✓' : '→'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.type === 'good' ? '良かったこと' : '改善したいこと'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">{item.text}</p>
                        </div>
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="pt-4 text-center">
                <button
                  onClick={goBack}
                  className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                >
                  ← 戻る
                </button>
              </div>
            </div>
          )}

          {step === 'chat' && selectedTopic && (
            <div className="mx-auto flex h-[calc(100vh-120px)] max-w-3xl flex-col">
              <div className="flex-shrink-0 border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm">
                <div className="flex items-center text-sm text-gray-600">
                  <span
                    className={`mr-2 ${selectedTopic.type === 'good' ? 'text-green-600' : 'text-blue-600'}`}
                  >
                    {selectedTopic.type === 'good' ? '✓' : '→'}
                  </span>
                  <span className="font-medium text-gray-900">{selectedTopic.text}</span>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex max-w-2xl items-start space-x-2">
                      {message.sender === 'ai' && (
                        <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                          <span className="text-xs">AI</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.sender === 'user'
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-200 bg-white text-gray-900'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                ))}

                {/* AIタイピングインジケーター */}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="flex max-w-2xl items-start space-x-2">
                      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <span className="text-xs">AI</span>
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                        <div className="flex space-x-1">
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '0ms' }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '150ms' }}
                          ></div>
                          <div
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '300ms' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
                <div className="flex items-end space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={e => setCurrentMessage(e.target.value)}
                    onKeyPress={e =>
                      e.key === 'Enter' && !e.shiftKey && !isAiTyping && sendMessage()
                    }
                    disabled={isAiTyping}
                    className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder={isAiTyping ? 'AIが回答中...' : 'メッセージを入力...'}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isAiTyping}
                    className="rounded-xl bg-gray-900 p-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={isAiTyping ? 'AIが回答中...' : '送信'}
                  >
                    {isAiTyping ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <button
                    onClick={goBack}
                    className="text-xs text-gray-500 transition-colors hover:text-gray-700"
                  >
                    ← トピック選択に戻る
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'history' && (
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-semibold text-gray-800">過去の振り返り</h2>
                <p className="mb-6 text-gray-600">これまでの記録を見返してみましょう</p>

                {/* 検索バー */}
                <div className="mx-auto max-w-md">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
                    placeholder="記録を検索..."
                  />
                </div>
              </div>

              {Object.keys(groupedRecords).length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">
                    {searchKeyword ? '検索結果が見つかりません' : 'まだ記録がありません'}
                  </p>
                </div>
              ) : (
                Object.keys(groupedRecords)
                  .sort((a, b) => b.localeCompare(a))
                  .map(yearMonth => (
                    <div key={yearMonth} className="space-y-3">
                      <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-700">
                        {new Date(yearMonth + '-01').toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </h3>

                      {groupedRecords[yearMonth]
                        .sort((a: any, b: any) => b.date.localeCompare(a.date))
                        .map((record: any) => (
                          <div
                            key={record.date}
                            className={`duration-800 ml-4 rounded-lg border border-gray-200 bg-white p-5 transition-all ${
                              deletingRecord === record.date
                                ? 'translate-x-full scale-95 transform opacity-0'
                                : 'scale-100 opacity-100'
                            }`}
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-800">
                                {new Date(record.date).toLocaleDateString('ja-JP', {
                                  month: 'short',
                                  day: 'numeric',
                                  weekday: 'short',
                                })}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => resumeFromHistory(record)}
                                  disabled={deletingRecord === record.date}
                                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                >
                                  振り返りを再開
                                </button>
                                {record.selectedItem &&
                                  record.chatMessages &&
                                  record.chatMessages.length > 1 && (
                                    <button
                                      onClick={() => resumeConversation(record)}
                                      disabled={deletingRecord === record.date}
                                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                                    >
                                      会話を再開
                                    </button>
                                  )}
                                <button
                                  onClick={() => setShowDeleteModal(record.date)}
                                  disabled={deletingRecord === record.date}
                                  className="group relative rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                  title="削除"
                                >
                                  {deletingRecord === record.date ? (
                                    <span className="flex items-center text-xs">
                                      <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent"></div>
                                      削除中...
                                    </span>
                                  ) : (
                                    <>
                                      <span className="group-hover:hidden">🗑️</span>
                                      <span className="hidden group-hover:inline">削除</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="mb-4 grid gap-4 md:grid-cols-2">
                              <div>
                                <h5 className="mb-2 text-xs font-medium text-green-700">
                                  良かったこと
                                </h5>
                                {(record.items || [])
                                  .filter((item: any) => item.type === 'good')
                                  .map((item: any) => (
                                    <p
                                      key={item.id}
                                      className="mb-1 rounded border border-green-200 bg-green-50 p-2 text-xs text-gray-700"
                                    >
                                      {searchKeyword &&
                                      item.text
                                        .toLowerCase()
                                        .includes(searchKeyword.toLowerCase()) ? (
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: item.text.replace(
                                              new RegExp(`(${searchKeyword})`, 'gi'),
                                              '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                            ),
                                          }}
                                        />
                                      ) : (
                                        item.text
                                      )}
                                    </p>
                                  ))}
                              </div>
                              <div>
                                <h5 className="mb-2 text-xs font-medium text-blue-700">
                                  改善したいこと
                                </h5>
                                {(record.items || [])
                                  .filter((item: any) => item.type === 'growth')
                                  .map((item: any) => (
                                    <p
                                      key={item.id}
                                      className="mb-1 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-gray-700"
                                    >
                                      {searchKeyword &&
                                      item.text
                                        .toLowerCase()
                                        .includes(searchKeyword.toLowerCase()) ? (
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: item.text.replace(
                                              new RegExp(`(${searchKeyword})`, 'gi'),
                                              '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                            ),
                                          }}
                                        />
                                      ) : (
                                        item.text
                                      )}
                                    </p>
                                  ))}
                              </div>
                            </div>

                            {record.selectedItem && (
                              <div className="border-t border-gray-200 pt-4">
                                <h5 className="mb-2 text-xs font-medium text-gray-700">
                                  選択したトピック
                                </h5>
                                <p className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
                                  {searchKeyword &&
                                  record.selectedItem.text
                                    .toLowerCase()
                                    .includes(searchKeyword.toLowerCase()) ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: record.selectedItem.text.replace(
                                          new RegExp(`(${searchKeyword})`, 'gi'),
                                          '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                        ),
                                      }}
                                    />
                                  ) : (
                                    record.selectedItem.text
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <span className="text-xl">🗑️</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">記録の削除</h3>
              <p className="mb-2 text-sm text-gray-600">
                {new Date(showDeleteModal).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
              <p className="mb-6 text-sm text-gray-700">
                この日の記録を削除しますか？
                <br />
                <span className="text-red-600">削除すると元に戻せません</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => deleteRecord(showDeleteModal)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
