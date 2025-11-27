import { ChatMessage, ReflectionItem } from '@/lib/types'

interface ChatInterfaceProps {
  selectedTopic: ReflectionItem
  chatMessages: ChatMessage[]
  currentMessage: string
  isAiTyping: boolean
  aiStatus?: string
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onBack: () => void
}

export function ChatInterface({
  selectedTopic,
  chatMessages,
  currentMessage,
  isAiTyping,
  aiStatus,
  onMessageChange,
  onSendMessage,
  onBack,
}: ChatInterfaceProps) {
  return (
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

        {isAiTyping && (
          <div className="flex justify-start">
            <div className="flex max-w-2xl items-start space-x-2">
              <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                <span className="text-xs">AI</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center space-x-2">
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
                  {aiStatus && (
                    <span className="text-xs text-gray-500">{aiStatus}</span>
                  )}
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
            onChange={e => onMessageChange(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && !isAiTyping && onSendMessage()}
            disabled={isAiTyping}
            className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
            placeholder={isAiTyping ? 'AIが回答中...' : 'メッセージを入力...'}
          />
          <button
            onClick={onSendMessage}
            disabled={!currentMessage.trim() || isAiTyping}
            className="rounded-xl bg-gray-900 p-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            title={isAiTyping ? 'AIが回答中...' : '送信'}
          >
            {isAiTyping ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            onClick={onBack}
            className="text-xs text-gray-500 transition-colors hover:text-gray-700"
          >
            ← トピック選択に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
