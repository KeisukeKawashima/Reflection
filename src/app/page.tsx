'use client'
import { useState } from 'react'

interface ReflectionItem {
  id: string
  text: string
  type: 'good' | 'growth'
}

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'ai'
}

type Step = 'input' | 'select' | 'chat'

export default function ReflectionApp() {
  const [step, setStep] = useState<Step>('input')
  const [items, setItems] = useState<ReflectionItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ReflectionItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')

  const addItem = (type: 'good' | 'growth') => {
    const newItem: ReflectionItem = {
      id: Date.now().toString(),
      text: '',
      type
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, text: string) => {
    setItems(items.map(item => item.id === id ? { ...item, text } : item))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const selectItemForReflection = (item: ReflectionItem) => {
    setSelectedItem(item)
    setStep('chat')
    
    // AIの最初のメッセージ
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `「${item.text}」について振り返りたいのですね。なぜこの点について深く考えたいと思ったのでしょうか？`,
      sender: 'ai'
    }
    setChatMessages([initialMessage])
  }

  const sendMessage = () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user'
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')

    // 簡単なAI応答のシミュレーション
    setTimeout(() => {
      const aiResponses = [
        'それは興味深い視点ですね。その背景にはどのような要因があると思いますか？',
        'なるほど。では、それに対してどのような課題を感じていますか？',
        'その考えに対して、反対の立場から見るとどうでしょうか？',
        'もしその状況を改善するとしたら、どのようなアプローチが考えられますか？',
        'これまでの経験で、似たような状況はありましたか？その時はどう対処しましたか？'
      ]
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'ai'
      }
      
      setChatMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  const goToNextStep = () => {
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
      setSelectedItem(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">振り返りの時間</h1>
        
        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600">まずは思ったことを自由に書き出してみましょう</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-green-700">良かったこと</h2>
                  <button 
                    onClick={() => addItem('good')}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                  >
                    追加
                  </button>
                </div>
                <div className="space-y-3">
                  {items.filter(item => item.type === 'good').map(item => (
                    <div key={item.id} className="relative">
                      <textarea
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                        className="w-full p-3 border rounded resize-none h-20"
                        placeholder="うまくいったこと、嬉しかったことを書いてください"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-blue-700">伸び代に感じたこと</h2>
                  <button 
                    onClick={() => addItem('growth')}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    追加
                  </button>
                </div>
                <div className="space-y-3">
                  {items.filter(item => item.type === 'growth').map(item => (
                    <div key={item.id} className="relative">
                      <textarea
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                        className="w-full p-3 border rounded resize-none h-20"
                        placeholder="改善できそうなこと、成長の余地を感じたことを書いてください"
                      />
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="text-center">
                <button
                  onClick={goToNextStep}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-purple-700"
                >
                  次へ進む
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600">この中で最も深く振り返りたいものを選んでください</p>
            </div>
            
            <div className="grid gap-4">
              {items.filter(item => item.text.trim()).map(item => (
                <div
                  key={item.id}
                  onClick={() => selectItemForReflection(item)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                    item.type === 'good' 
                      ? 'bg-green-50 border-green-200 hover:border-green-400' 
                      : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-gray-800">{item.text}</p>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.type === 'good' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      {item.type === 'good' ? '良かったこと' : '伸び代'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={goBack}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {step === 'chat' && selectedItem && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">振り返り対象</h2>
              <p className={`p-3 rounded ${
                selectedItem.type === 'good' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                {selectedItem.text}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow h-96 flex flex-col">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 p-2 border rounded"
                    placeholder="考えを入力してください..."
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={goBack}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
