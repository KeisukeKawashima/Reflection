import { useState, useCallback } from 'react'
import { ChatMessage, ReflectionItem } from '@/lib/types'

export function useChatMessages() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [aiStatus, setAiStatus] = useState('')

  const sendMessage = useCallback(
    async (selectedTopic: ReflectionItem | null, onSave: () => void) => {
      if (!currentMessage.trim() || isAiTyping) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: currentMessage,
        sender: 'user',
      }

      setChatMessages(prev => {
        const newMessages = [...prev, userMessage]
        setTimeout(onSave, 50)
        return newMessages
      })

      const messageText = currentMessage
      setCurrentMessage('')
      setIsAiTyping(true)
      setAiStatus('AIに問い合わせ中...')

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            selectedTopic: selectedTopic?.text,
            conversationHistory: chatMessages,
          }),
        })

        const data = await response.json()

        if (data.error) {
          setAiStatus('エラーが発生しました')
          console.error('API Error:', data.error, 'Source:', data.source)
        } else {
          console.log('AI Response source:', data.source)
        }

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          sender: 'ai',
        }

        setChatMessages(prev => {
          const newMessages = [...prev, aiMessage]
          setTimeout(onSave, 100)
          return newMessages
        })
      } catch (error) {
        setAiStatus('接続エラー')
        const fallbackMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: 'その視点は興味深いですね。もう少し詳しく教えてください。',
          sender: 'ai',
        }
        setChatMessages(prev => {
          const newMessages = [...prev, fallbackMessage]
          setTimeout(onSave, 100)
          return newMessages
        })
      } finally {
        setIsAiTyping(false)
        setAiStatus('')
      }
    },
    [currentMessage, isAiTyping, chatMessages.length]
  )

  const initializeChat = useCallback((topic: ReflectionItem) => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `「${topic.text}」について振り返りたいのですね。なぜこの点について深く考えたいと思ったのでしょうか？`,
      sender: 'ai',
    }
    setChatMessages([initialMessage])
  }, [])

  return {
    chatMessages,
    setChatMessages,
    currentMessage,
    setCurrentMessage,
    isAiTyping,
    aiStatus,
    sendMessage,
    initializeChat,
  }
}
