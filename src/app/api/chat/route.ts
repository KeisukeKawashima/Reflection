import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  const { message, selectedTopic, conversationHistory } = await request.json()

  const systemPrompt = `あなたは振り返りを支援するコーチです。ユーザーが選んだトピック「${selectedTopic}」について深く考えるための質問をしてください。

会話の流れに応じて適切な質問をしてください：
- 初期段階: 背景や具体的状況を探る
- 中期段階: 視点転換や深掘り質問
- 後期段階: 行動や学びに焦点

質問は簡潔で、ユーザーの思考の外側にある視点を提供してください。`

  // APIキーの確認
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set')
    return NextResponse.json({
      message: 'その背景にはどのような要因があると思いますか？',
      error: 'API key not configured',
    })
  }

  // リトライ機能
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}: Calling Gemini API`)

      const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

      // 会話履歴を含めたプロンプトを構築
      let fullPrompt = systemPrompt + '\n\n'
      if (conversationHistory && conversationHistory.length > 0) {
        fullPrompt += '会話履歴:\n'
        conversationHistory.forEach((msg: any) => {
          fullPrompt += `${msg.sender === 'user' ? 'ユーザー' : 'AI'}: ${msg.text}\n`
        })
        fullPrompt += '\n'
      }
      fullPrompt += `ユーザーのメッセージ: ${message}`

      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: fullPrompt,
      })

      const text = response.text

      if (text) {
        console.log('Successfully got response from Gemini:', text.substring(0, 100))
        return NextResponse.json({ message: text, source: 'gemini' })
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)
      if (attempt === 2) break
      await sleep(1000)
    }
  }

  // フォールバック応答
  console.log('Using fallback response')
  return NextResponse.json({
    message: 'その視点は興味深いですね。もう少し詳しく教えてください。',
    error: 'API request failed after retries',
    source: 'fallback',
  })
}
