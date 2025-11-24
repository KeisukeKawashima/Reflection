'use client'
import { useState, useEffect } from 'react'

interface ReflectionItem {
  id: string
  text: string
  type: 'good' | 'growth'
  x: number
  y: number
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
          chatMessages
        })
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedItem) {
        e.preventDefault()
        const item = items.find(i => i.id === selectedItem)
        if (item) {
          setCopiedItem(item)
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedItem) {
        e.preventDefault()
        const newItem: ReflectionItem = {
          id: Date.now().toString(),
          text: copiedItem.text,
          type: copiedItem.type,
          x: Math.min(copiedItem.x + 20, 600),
          y: Math.min(copiedItem.y + 20, 480)
        }
        setItems([...items, newItem])
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
      y: Math.random() * 500 + 50
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, text: string) => {
    setItems(items.map(item => item.id === id ? { ...item, text } : item))
  }

  const autoResizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = '0px'
    element.style.height = Math.max(element.scrollHeight, 80) + 'px'
  }

  const moveItem = (id: string, x: number, y: number) => {
    setItems(items.map(item => item.id === id ? { ...item, x, y } : item))
  }

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - 96 // 付箋幅の半分
    const y = e.clientY - rect.top - 56  // 付箋高さの半分
    
    moveItem(draggedItem, 
      Math.max(0, Math.min(x, rect.width - 192)), 
      Math.max(0, Math.min(y, rect.height - 112))
    )
  }

  const handleMouseUp = () => {
    setDraggedItem(null)
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const copyItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    
    const newItem: ReflectionItem = {
      id: Date.now().toString(),
      text: item.text,
      type: item.type,
      x: item.x + 20,
      y: item.y + 20
    }
    setItems([...items, newItem])
  }

  const selectItemForReflection = (item: ReflectionItem) => {
    setSelectedTopic(item)
    setStep('chat')
    
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `「${item.text}」について振り返りたいのですね。なぜこの点について深く考えたいと思ったのでしょうか？`,
      sender: 'ai'
    }
    setChatMessages([initialMessage])
    setTimeout(() => saveRecord(), 100)
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user'
    }

    setChatMessages(prev => {
      const newMessages = [...prev, userMessage]
      setTimeout(() => saveRecord(), 50)
      return newMessages
    })
    
    const messageCount = chatMessages.length
    const messageText = currentMessage
    setCurrentMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          selectedTopic: selectedTopic?.text,
          messageCount
        })
      })

      const data = await response.json()
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai'
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
        sender: 'ai'
      }
      setChatMessages(prev => {
        const newMessages = [...prev, fallbackMessage]
        setTimeout(() => saveRecord(), 100)
        return newMessages
      })
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
      <div className="max-w-full mx-auto">
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex justify-between items-center px-4 py-3 max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <h1 
                className="text-lg font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
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
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep('history')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                title="履歴"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="新しく始める"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
            <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-2">
              <button 
                onClick={() => addItem('good')}
                className="group flex items-center px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-md hover:shadow-lg border border-gray-200"
                title="良かったこと"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">良かったこと</span>
              </button>
              <button 
                onClick={() => addItem('growth')}
                className="group flex items-center px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-md hover:shadow-lg border border-gray-200"
                title="改善したいこと"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">改善したいこと</span>
              </button>
            </div>
            
            {/* ボード */}
            <div 
              data-board
              className="fixed inset-0 top-[73px] bg-gray-50 overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* ウェルカムメッセージ */}
              {showWelcome && items.length === 0 && (
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-50 z-30 transition-opacity duration-1000 ${
                  showWelcome ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="text-center animate-fade-in">
                    <p className="text-2xl text-gray-700 font-light">
                      今日を振り返り問題発見して生きましょう
                    </p>
                  </div>
                </div>
              )}

              {/* 付箋 */}
              {items.map(item => (
                <div
                  key={item.id}
                  className={`absolute w-56 p-4 rounded-xl shadow-sm cursor-move select-none border backdrop-blur-sm ${
                    item.type === 'good' 
                      ? 'bg-green-50/90 text-gray-800 border-green-200/50' 
                      : 'bg-blue-50/90 text-gray-800 border-blue-200/50'
                  } ${draggedItem === item.id ? 'shadow-lg z-50 scale-105' : 'hover:shadow-md transition-all'} ${
                    selectedItem === item.id ? 'ring-2 ring-gray-300' : ''
                  }`}
                  style={{ left: item.x, top: item.y }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onClick={() => setSelectedItem(item.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      item.type === 'good' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {item.type === 'good' ? '✓ 良かったこと' : '→ 改善したいこと'}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center rounded hover:bg-gray-200/50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={item.text}
                    onChange={(e) => {
                      updateItem(item.id, e.target.value)
                      setTimeout(() => autoResizeTextarea(e.target), 0)
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none text-sm placeholder-gray-400 block break-words"
                    placeholder="入力してください..."
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ 
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      overflow: 'hidden'
                    }}
                  />
                </div>
              ))}

              {/* 空の状態（ウェルカムメッセージが消えた後） */}
              {items.length === 0 && !showWelcome && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-300">
                    <p className="text-base">付箋を追加して始めましょう</p>
                  </div>
                </div>
              )}
            </div>

            {/* 次へ進むボタン - 右下固定 */}
            {items.filter(item => item.text.trim()).length > 0 && (
              <div className="fixed bottom-6 right-6 z-20">
                <button
                  onClick={goToNextStep}
                  className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg hover:shadow-xl text-sm"
                >
                  次へ進む
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'select' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-medium text-gray-900 mb-2">どれについて深く考えてみますか？</h2>
              <p className="text-sm text-gray-500">一つ選んでAIと対話してみましょう</p>
            </div>
            
            <div className="space-y-2">
              {items.filter(item => item.text.trim()).map(item => (
                <div
                  key={item.id}
                  onClick={() => selectItemForReflection(item)}
                  className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center mb-1">
                        <span className={`text-xs font-medium mr-2 ${
                          item.type === 'good' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {item.type === 'good' ? '✓' : '→'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.type === 'good' ? '良かったこと' : '改善したいこと'}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm">{item.text}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                onClick={goBack}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← 戻る
              </button>
            </div>
          </div>
        )}

        {step === 'chat' && selectedTopic && (
          <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center text-sm text-gray-600">
                <span className={`mr-2 ${selectedTopic.type === 'good' ? 'text-green-600' : 'text-blue-600'}`}>
                  {selectedTopic.type === 'good' ? '✓' : '→'}
                </span>
                <span className="text-gray-900 font-medium">{selectedTopic.text}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatMessages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-2 max-w-2xl">
                    {message.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-xs">AI</span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm ${
                        message.sender === 'user'
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
              <div className="flex items-end space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors text-sm resize-none"
                  placeholder="メッセージを入力..."
                />
                <button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim()}
                  className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-center">
                <button
                  onClick={goBack}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← トピック選択に戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'history' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">過去の振り返り</h2>
              <p className="text-gray-600 mb-6">これまでの記録を見返してみましょう</p>
              
              {/* 検索バー */}
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none transition-colors text-sm"
                  placeholder="記録を検索..."
                />
              </div>
            </div>

            {Object.keys(groupedRecords).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchKeyword ? '検索結果が見つかりません' : 'まだ記録がありません'}
                </p>
              </div>
            ) : (
              Object.keys(groupedRecords)
                .sort((a, b) => b.localeCompare(a))
                .map(yearMonth => (
                  <div key={yearMonth} className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
                      {new Date(yearMonth + '-01').toLocaleDateString('ja-JP', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </h3>
                    
                    {groupedRecords[yearMonth]
                      .sort((a: any, b: any) => b.date.localeCompare(a.date))
                      .map((record: any) => (
                        <div key={record.date} className={`bg-white p-5 rounded-lg border border-gray-200 ml-4 transition-all duration-800 ${
                          deletingRecord === record.date 
                            ? 'opacity-0 scale-95 transform translate-x-full' 
                            : 'opacity-100 scale-100'
                        }`}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-medium text-gray-800">
                              {new Date(record.date).toLocaleDateString('ja-JP', { 
                                month: 'short', 
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => resumeFromHistory(record)}
                                disabled={deletingRecord === record.date}
                                className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-md text-xs hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                振り返りを再開
                              </button>
                              {record.selectedItem && record.chatMessages && record.chatMessages.length > 1 && (
                                <button
                                  onClick={() => resumeConversation(record)}
                                  disabled={deletingRecord === record.date}
                                  className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-md text-xs hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                  会話を再開
                                </button>
                              )}
                              <button
                                onClick={() => setShowDeleteModal(record.date)}
                                disabled={deletingRecord === record.date}
                                className="group relative bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="削除"
                              >
                                {deletingRecord === record.date ? (
                                  <span className="flex items-center text-xs">
                                    <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
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
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-green-700 mb-2 text-xs">良かったこと</h5>
                              {(record.items || []).filter((item: any) => item.type === 'good').map((item: any) => (
                                <p key={item.id} className="text-xs bg-green-50 border border-green-200 text-gray-700 p-2 rounded mb-1">
                                  {searchKeyword && item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: item.text.replace(
                                        new RegExp(`(${searchKeyword})`, 'gi'),
                                        '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    item.text
                                  )}
                                </p>
                              ))}
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-700 mb-2 text-xs">改善したいこと</h5>
                              {(record.items || []).filter((item: any) => item.type === 'growth').map((item: any) => (
                                <p key={item.id} className="text-xs bg-blue-50 border border-blue-200 text-gray-700 p-2 rounded mb-1">
                                  {searchKeyword && item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: item.text.replace(
                                        new RegExp(`(${searchKeyword})`, 'gi'),
                                        '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    item.text
                                  )}
                                </p>
                              ))}
                            </div>
                          </div>

                          {record.selectedItem && (
                            <div className="border-t border-gray-200 pt-4">
                              <h5 className="font-medium text-gray-700 mb-2 text-xs">選択したトピック</h5>
                              <p className="text-xs bg-gray-50 text-gray-700 p-2 rounded border border-gray-200 mb-3">
                                {searchKeyword && record.selectedItem.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                  <span dangerouslySetInnerHTML={{
                                    __html: record.selectedItem.text.replace(
                                      new RegExp(`(${searchKeyword})`, 'gi'),
                                      '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
                                    )
                                  }} />
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🗑️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">記録の削除</h3>
              <p className="text-gray-600 mb-2 text-sm">
                {new Date(showDeleteModal).toLocaleDateString('ja-JP', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
              <p className="text-gray-700 mb-6 text-sm">
                この日の記録を削除しますか？<br />
                <span className="text-red-600">削除すると元に戻せません</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => deleteRecord(showDeleteModal)}
                  className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors font-medium"
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
