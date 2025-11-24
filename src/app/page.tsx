'use client'
import { useState, useEffect } from 'react'
import { Step, ReflectionItem } from '@/lib/types'
import { useReflectionItems } from '@/hooks/useReflectionItems'
import { useConnections } from '@/hooks/useConnections'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useRecords } from '@/hooks/useRecords'
import { ReflectionBoard } from '@/components/reflection/ReflectionBoard'
import { TopicSelector } from '@/components/reflection/TopicSelector'
import { ChatInterface } from '@/components/reflection/ChatInterface'
import { HistoryView } from '@/components/reflection/HistoryView'

export default function ReflectionApp() {
  const [step, setStep] = useState<Step>('input')
  const [selectedTopic, setSelectedTopic] = useState<ReflectionItem | null>(null)

  const {
    items,
    setItems,
    selectedItem,
    setSelectedItem,
    copiedItem,
    setCopiedItem,
    addItem,
    updateItem,
    moveItem,
    deleteItem,
    copyItem,
  } = useReflectionItems()

  const {
    connections,
    setConnections,
    connectingFrom,
    connectionPreview,
    hoveredPoint,
    setHoveredPoint,
    startConnection,
    completeConnection,
    deleteConnection,
    deleteItemConnections,
  } = useConnections(items)

  const {
    chatMessages,
    setChatMessages,
    currentMessage,
    setCurrentMessage,
    isAiTyping,
    sendMessage,
    initializeChat,
  } = useChatMessages()

  const { records, deletingRecord, saveRecord, deleteRecord } = useRecords()

  const today = new Date().toISOString().split('T')[0]

  const handleSaveRecord = () => {
    saveRecord(today, items, selectedItem, chatMessages)
  }

  const handleDeleteItem = (id: string) => {
    deleteItem(id)
    deleteItemConnections(id)
  }

  const selectItemForReflection = (item: ReflectionItem) => {
    setSelectedTopic(item)
    setStep('chat')
    initializeChat(item)
    setTimeout(handleSaveRecord, 100)
  }

  const handleSendMessage = () => {
    sendMessage(selectedTopic, handleSaveRecord)
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

  const resetApp = () => {
    setStep('input')
    setItems([])
    setSelectedItem(null)
    setChatMessages([])
    setConnections([])
    setSelectedTopic(null)
  }

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return
      }

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
          y: Math.min(copiedItem.y + 20, 480),
        }
        setItems([...items, newItem])
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem) {
        e.preventDefault()
        handleDeleteItem(selectedItem)
        setSelectedItem(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, copiedItem, items])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-full">
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <h1
                className="cursor-pointer text-lg font-medium text-gray-900 transition-colors hover:text-gray-700"
                onClick={resetApp}
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
                  onClick={resetApp}
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
            <ReflectionBoard
              items={items}
              selectedItem={selectedItem}
              connections={connections}
              connectingFrom={connectingFrom}
              connectionPreview={connectionPreview}
              hoveredPoint={hoveredPoint}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onMoveItem={moveItem}
              onDeleteItem={handleDeleteItem}
              onSelectItem={setSelectedItem}
              onStartConnection={startConnection}
              onCompleteConnection={completeConnection}
              onDeleteConnection={deleteConnection}
              onHoverPoint={setHoveredPoint}
              onNext={goToNextStep}
            />
          )}

          {step === 'select' && (
            <TopicSelector items={items} onSelectTopic={selectItemForReflection} onBack={goBack} />
          )}

          {step === 'chat' && selectedTopic && (
            <ChatInterface
              selectedTopic={selectedTopic}
              chatMessages={chatMessages}
              currentMessage={currentMessage}
              isAiTyping={isAiTyping}
              onMessageChange={setCurrentMessage}
              onSendMessage={handleSendMessage}
              onBack={goBack}
            />
          )}

          {step === 'history' && (
            <HistoryView
              records={records}
              deletingRecord={deletingRecord}
              onResumeFromHistory={resumeFromHistory}
              onResumeConversation={resumeConversation}
              onDeleteRecord={deleteRecord}
            />
          )}
        </div>
      </div>
    </div>
  )
}
