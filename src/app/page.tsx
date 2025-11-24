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
    <div className="min-h-screen bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25"></div>
            <div className="relative bg-slate-900 px-6 py-4 rounded-lg">
              <p className="text-slate-400 text-sm mb-2 font-mono">
                {new Date().toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit',
                  weekday: 'short'
                })}
              </p>
              <h1 
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  setStep('input')
                  setItems([])
                  setSelectedItem(null)
                  setChatMessages([])
                }}
              >
                今日の振り返り
              </h1>
              <p className="text-slate-500 text-sm mt-1">今日はどんな一日でしたか？</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setStep('history')}
              className="relative group px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all duration-300 hover:border-purple-500"
            >
              <span className="relative z-10">履歴</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            {step !== 'input' && (
              <button
                onClick={() => {
                  setStep('input')
                  setItems([])
                  setSelectedItem(null)
                  setChatMessages([])
                }}
                className="relative group px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                新しく始める
              </button>
            )}
          </div>
        </div>

        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20"></div>
                <div className="relative bg-slate-800 px-8 py-6 rounded-lg border border-slate-700">
                  <h2 className="text-2xl font-bold text-white mb-2">今日を振り返ってみましょう</h2>
                  <p className="text-slate-400">付箋を追加して自由に配置してください</p>
                </div>
              </div>
            </div>

            {/* ツールバー */}
            <div className="flex justify-center space-x-4 mb-6">
              <button 
                onClick={() => addItem('good')}
                className="flex items-center px-4 py-2 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 hover:bg-green-600/30 transition-all duration-300"
              >
                <span className="mr-2">+</span>良かったこと
              </button>
              <button 
                onClick={() => addItem('growth')}
                className="flex items-center px-4 py-2 bg-blue-600/20 border border-blue-600/30 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-all duration-300"
              >
                <span className="mr-2">+</span>改善したいこと
              </button>
            </div>
            
            {/* Miroライクなボード */}
            <div 
              data-board
              className="relative w-full h-[600px] bg-slate-800 border-2 border-slate-700 rounded-2xl overflow-hidden cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minWidth: '800px' }}
            >
              {/* グリッド背景 */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" className="text-slate-600" />
                </svg>
              </div>

              {/* 付箋 */}
              {items.map(item => (
                <div
                  key={item.id}
                  className={`absolute w-48 p-3 pt-6 rounded-lg shadow-lg cursor-move select-none ${
                    item.type === 'good' 
                      ? 'bg-green-400 text-green-900' 
                      : 'bg-blue-400 text-blue-900'
                  } ${draggedItem === item.id ? 'scale-105 shadow-2xl z-50' : 'hover:scale-102 transition-transform duration-200'} ${
                    selectedItem === item.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  style={{ left: item.x, top: item.y }}
                  onMouseDown={(e) => handleMouseDown(e, item.id)}
                  onClick={() => setSelectedItem(item.id)}
                >
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors z-10"
                  >
                    ×
                  </button>
                  <textarea
                    value={item.text}
                    onChange={(e) => {
                      updateItem(item.id, e.target.value)
                      setTimeout(() => autoResizeTextarea(e.target), 0)
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none text-sm font-medium placeholder-current placeholder-opacity-60 block break-words"
                    placeholder={item.type === 'good' ? 'うまくいったこと...' : 'もっと良くできそうなこと...'}
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

              {/* 空の状態 */}
              {items.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <p className="text-lg mb-2">付箋を追加して始めましょう</p>
                    <p className="text-sm">上のボタンから「良かったこと」や「改善したいこと」を追加できます</p>
                  </div>
                </div>
              )}
            </div>

            {items.filter(item => item.text.trim()).length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={goToNextStep}
                  className="relative group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">次へ進む</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <div className="inline-block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20"></div>
                <div className="relative bg-slate-800 px-8 py-6 rounded-lg border border-slate-700">
                  <h2 className="text-2xl font-bold text-white mb-2">どれについて深く考えてみますか？</h2>
                  <p className="text-slate-400">一つ選んでAIと対話してみましょう</p>
                </div>
              </div>
            </div>
            
            <div className="grid gap-6">
              {items.filter(item => item.text.trim()).map(item => (
                <div
                  key={item.id}
                  onClick={() => selectItemForReflection(item)}
                  className="relative group cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-2xl"
                >
                  <div className={`absolute -inset-0.5 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300 ${
                    item.type === 'good' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}></div>
                  <div className="relative bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-200 flex-1 mr-4">{item.text}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === 'good' 
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                          : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      }`}>
                        {item.type === 'good' ? '良かったこと' : '改善したいこと'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={goBack}
                className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-all duration-300"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {step === 'chat' && selectedTopic && (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-3">選んだトピック</h2>
              <div className={`p-4 rounded-lg border ${
                selectedTopic.type === 'good' 
                  ? 'bg-green-600/10 border-green-600/30 text-green-300' 
                  : 'bg-blue-600/10 border-blue-600/30 text-blue-300'
              }`}>
                {selectedTopic.text}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 h-96 flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200 border border-slate-600'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-700 p-4">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 p-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-400 focus:outline-none transition-colors"
                    placeholder="思ったことを入力してください..."
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={goBack}
                className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition-all duration-300"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {step === 'history' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">過去の振り返り</h2>
              <p className="text-slate-400 mb-6">これまでの記録を見返してみましょう</p>
              
              {/* 検索バー */}
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-400 focus:outline-none transition-colors"
                  placeholder="記憶を検索..."
                />
              </div>
            </div>

            {Object.keys(groupedRecords).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  {searchKeyword ? '検索結果が見つかりません' : 'まだ記録がありません'}
                </p>
              </div>
            ) : (
              Object.keys(groupedRecords)
                .sort((a, b) => b.localeCompare(a))
                .map(yearMonth => (
                  <div key={yearMonth} className="space-y-4">
                    <h3 className="text-lg font-semibold text-purple-400 border-b border-slate-700 pb-2">
                      {new Date(yearMonth + '-01').toLocaleDateString('ja-JP', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </h3>
                    
                    {groupedRecords[yearMonth]
                      .sort((a: any, b: any) => b.date.localeCompare(a.date))
                      .map((record: any) => (
                        <div key={record.date} className={`bg-slate-800 p-6 rounded-2xl border border-slate-700 ml-4 transition-all duration-800 ${
                          deletingRecord === record.date 
                            ? 'opacity-0 scale-95 transform translate-x-full' 
                            : 'opacity-100 scale-100'
                        }`}>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-white">
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
                                className="bg-blue-600/20 border border-blue-600/30 text-blue-400 px-3 py-1 rounded-full text-sm hover:bg-blue-600/30 transition-all disabled:opacity-50"
                              >
                                振り返りを再開
                              </button>
                              {record.selectedItem && record.chatMessages && record.chatMessages.length > 1 && (
                                <button
                                  onClick={() => resumeConversation(record)}
                                  disabled={deletingRecord === record.date}
                                  className="bg-purple-600/20 border border-purple-600/30 text-purple-400 px-3 py-1 rounded-full text-sm hover:bg-purple-600/30 transition-all disabled:opacity-50"
                                >
                                  会話を再開
                                </button>
                              )}
                              <button
                                onClick={() => setShowDeleteModal(record.date)}
                                disabled={deletingRecord === record.date}
                                className="group relative bg-red-600/10 border border-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm hover:bg-red-600/20 hover:border-red-600/40 transition-all disabled:opacity-50"
                                title="記憶を消去"
                              >
                                {deletingRecord === record.date ? (
                                  <span className="flex items-center">
                                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                                    消去中...
                                  </span>
                                ) : (
                                  <>
                                    <span className="group-hover:hidden">🗑️</span>
                                    <span className="hidden group-hover:inline">消去</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-green-400 mb-2 text-sm">良かったこと</h5>
                              {(record.items || []).filter((item: any) => item.type === 'good').map((item: any) => (
                                <p key={item.id} className="text-xs bg-green-600/10 border border-green-600/20 text-slate-300 p-2 rounded mb-1">
                                  {searchKeyword && item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: item.text.replace(
                                        new RegExp(`(${searchKeyword})`, 'gi'),
                                        '<mark class="bg-yellow-400 text-black">$1</mark>'
                                      )
                                    }} />
                                  ) : (
                                    item.text
                                  )}
                                </p>
                              ))}
                            </div>
                            <div>
                              <h5 className="font-medium text-blue-400 mb-2 text-sm">改善したいこと</h5>
                              {(record.items || []).filter((item: any) => item.type === 'growth').map((item: any) => (
                                <p key={item.id} className="text-xs bg-blue-600/10 border border-blue-600/20 text-slate-300 p-2 rounded mb-1">
                                  {searchKeyword && item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                    <span dangerouslySetInnerHTML={{
                                      __html: item.text.replace(
                                        new RegExp(`(${searchKeyword})`, 'gi'),
                                        '<mark class="bg-yellow-400 text-black">$1</mark>'
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
                            <div className="border-t border-slate-700 pt-4">
                              <h5 className="font-medium text-slate-300 mb-2 text-sm">選択したトピック</h5>
                              <p className="text-xs bg-slate-700 text-slate-300 p-2 rounded mb-3">
                                {searchKeyword && record.selectedItem.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                  <span dangerouslySetInnerHTML={{
                                    __html: record.selectedItem.text.replace(
                                      new RegExp(`(${searchKeyword})`, 'gi'),
                                      '<mark class="bg-yellow-400 text-black">$1</mark>'
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

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full mx-4 transform animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">記録の削除</h3>
              <p className="text-slate-400 mb-2">
                {new Date(showDeleteModal).toLocaleDateString('ja-JP', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
              <p className="text-slate-300 mb-6">
                この日の記録を削除しますか？<br />
                <span className="text-red-400 text-sm">削除すると元に戻せません</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => deleteRecord(showDeleteModal)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-lg text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium"
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
