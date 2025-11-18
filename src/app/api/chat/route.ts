import { NextRequest, NextResponse } from 'next/server'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  const { message, selectedTopic, messageCount } = await request.json()

  const systemPrompt = `あなたは振り返りを支援するコーチです。ユーザーが選んだトピック「${selectedTopic}」について深く考えるための質問をしてください。

段階に応じた質問をしてください：
- 初期段階（1-2回目）: 背景や具体的状況を探る
- 中期段階（3-4回目）: 視点転換や深掘り質問
- 後期段階（5回目以降）: 行動や学びに焦点

質問は簡潔で、ユーザーの思考の外側にある視点を提供してください。`

  // リトライ機能
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      if (response.status === 429) {
        // Rate limit - 指数バックオフで待機
        const waitTime = Math.pow(2, attempt) * 1000
        await sleep(waitTime)
        continue
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return NextResponse.json({ message: data.choices[0].message.content })
      }
    } catch (error) {
      if (attempt === 2) break // 最後の試行
      await sleep(1000)
    }
  }

  // フォールバック応答
  const fallbackResponses = [
    'その背景にはどのような要因があると思いますか？',
    'もう少し具体的に教えてください。その時の状況はどうでしたか？',
    'その考えに対して、反対の立場から見るとどうでしょうか？',
    'もしあなたの親しい友人が同じ状況にいたら、どんなアドバイスをしますか？',
    'これまでの対話を通じて、新しく気づいたことはありますか？'
  ]
  
  const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
  return NextResponse.json({ message: randomResponse })
}
