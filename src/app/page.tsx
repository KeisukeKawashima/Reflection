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
  const [selectedItem, setSelectedItem] = useState<ReflectionItem | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [records, setRecords] = useState<DailyRecord[]>([])

  const today = new Date().toISOString().split('T')[0]

  // ローカルストレージから記録を読み込み
  const loadRecords = () => {
    const saved = localStorage.getItem('reflection-records')
    if (saved) {
      setRecords(JSON.parse(saved))
    }
  }

  // 記録を保存
  const saveRecord = () => {
    const record: DailyRecord = {
      date: today,
      items: items.filter(item => item.text.trim()),
      selectedItem,
      chatMessages
    }
    
    const updatedRecords = records.filter(r => r.date !== today)
    updatedRecords.push(record)
    
    setRecords(updatedRecords)
    localStorage.setItem('reflection-records', JSON.stringify(updatedRecords))
  }

  // 今日の記録があるかチェック
  const todayRecord = records.find(r => r.date === today)

  // 初回読み込み
  useState(() => {
    loadRecords()
  })

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
    
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `「${item.text}」について振り返りたいのですね。なぜこの点について深く考えたいと思ったのでしょうか？`,
      sender: 'ai'
    }
    setChatMessages([initialMessage])
    saveRecord() // 選択時に保存
  }

  const getAIResponse = (userText: string, messageCount: number): string => {
    const lowerText = userText.toLowerCase()
    
    // 段階的な質問パターン
    if (messageCount <= 2) {
      // 初期段階：背景を探る
      if (lowerText.includes('うまく') || lowerText.includes('良かった')) {
        return 'その成功の要因は何だったと思いますか？偶然ではなく、あなたの行動や判断で影響したことはありますか？'
      }
      if (lowerText.includes('課題') || lowerText.includes('問題')) {
        return 'その課題が生まれた根本的な原因は何でしょうか？表面的な問題の奥にある本質を考えてみてください。'
      }
      return 'もう少し具体的に教えてください。その時の状況や、あなたの感情はどうでしたか？'
    }
    
    if (messageCount <= 4) {
      // 中期段階：深掘りと視点転換
      const challenges = [
        'では、その考えに対して「本当にそうだろうか？」と疑問を持ってみてください。反対の証拠はありませんか？',
        'もしあなたの親しい友人が同じ状況にいたら、どんなアドバイスをしますか？',
        'その状況で、あなたが最も恐れていることは何ですか？その恐れは現実的でしょうか？'
      ]
      return challenges[Math.floor(Math.random() * challenges.length)]
    }
    
    // 後期段階：行動と学びに焦点
    const actionQuestions = [
      'これまでの対話を通じて、新しく気づいたことはありますか？',
      '明日から実際に変えられることを一つ挙げるとしたら何でしょうか？',
      'この経験から得た最も重要な学びを一言で表すとしたら？',
      '同じような状況に再び直面した時、今度はどう行動しますか？'
    ]
    return actionQuestions[Math.floor(Math.random() * actionQuestions.length)]
  }

  const sendMessage = () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user'
    }

    setChatMessages(prev => [...prev, userMessage])
    const messageCount = chatMessages.length
    setCurrentMessage('')

    setTimeout(() => {
      const aiResponse = getAIResponse(currentMessage, messageCount)
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai'
      }
      
      setChatMessages(prev => [...prev, aiMessage])
      saveRecord() // メッセージ送信時に保存
    }, 1500)
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">振り返りの時間</h1>
          <div className="space-x-2">
            <button
              onClick={() => setStep('history')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              履歴
            </button>
            {step !== 'input' && (
              <button
                onClick={() => {
                  setStep('input')
                  setItems([])
                  setSelectedItem(null)
                  setChatMessages([])
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                新規作成
              </button>
            )}
          </div>
        </div>

        {step === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4">過去の振り返り</h2>
            {records.length === 0 ? (
              <p className="text-gray-500">まだ記録がありません</p>
            ) : (
              records.sort((a, b) => b.date.localeCompare(a.date)).map(record => (
                <div key={record.date} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-3">{record.date}</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">良かったこと</h4>
                      {record.items.filter(item => item.type === 'good').map(item => (
                        <p key={item.id} className="text-sm bg-green-50 p-2 rounded mb-1">{item.text}</p>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">伸び代</h4>
                      {record.items.filter(item => item.type === 'growth').map(item => (
                        <p key={item.id} className="text-sm bg-blue-50 p-2 rounded mb-1">{item.text}</p>
                      ))}
                    </div>
                  </div>

                  {record.selectedItem && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">選択したトピック</h4>
                      <p className="text-sm bg-gray-50 p-2 rounded mb-3">{record.selectedItem.text}</p>
                      
                      {record.chatMessages.length > 1 && (
                        <div>
                          <h4 className="font-medium mb-2">対話記録</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {record.chatMessages.map(msg => (
                              <div key={msg.id} className={`text-xs p-2 rounded ${
                                msg.sender === 'user' ? 'bg-purple-100 ml-4' : 'bg-gray-100 mr-4'
                              }`}>
                                <span className="font-medium">{msg.sender === 'user' ? 'あなた' : 'AI'}:</span> {msg.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
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
