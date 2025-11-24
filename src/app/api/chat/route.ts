import { NextRequest, NextResponse } from 'next/server'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// トピックと段階に応じた質問テンプレート
const questionTemplates = {
  initial: [
    'その状況について、もう少し詳しく教えてください。',
    'そのとき、あなたはどのように感じましたか？',
    'その出来事の背景には何があったのでしょうか？',
    'その時の具体的な状況を教えてください。',
  ],
  middle: [
    '別の視点から見ると、どのように見えるでしょうか？',
    'もし時間を戻せるとしたら、何を変えたいですか？',
    'その経験から、何を学びましたか？',
    'なぜそのような結果になったと思いますか？',
  ],
  late: [
    'この経験を今後どのように活かせそうですか？',
    '同じような状況になったら、どう対応しますか？',
    'この振り返りを通じて、新しく気づいたことはありますか？',
    '今後の行動計画について考えてみましょう。',
  ],
}

function getSmartFallbackResponse(messageCount: number): string {
  let stage: 'initial' | 'middle' | 'late'

  if (messageCount <= 2) {
    stage = 'initial'
  } else if (messageCount <= 4) {
    stage = 'middle'
  } else {
    stage = 'late'
  }

  const questions = questionTemplates[stage]
  return questions[Math.floor(Math.random() * questions.length)]
}

export async function POST(request: NextRequest) {
  const { message, selectedTopic, messageCount } = await request.json()

  const systemPrompt = `あなたは振り返りを支援するコーチです。ユーザーが選んだトピック「${selectedTopic}」について深く考えるための質問をしてください。

段階に応じた質問をしてください：
- 初期段階（1-2回目）: 背景や具体的状況を探る
- 中期段階（3-4回目）: 視点転換や深掘り質問
- 後期段階（5回目以降）: 行動や学びに焦点

質問は簡潔で、ユーザーの思考の外側にある視点を提供してください。`

  // APIキーの確認
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set')
    return NextResponse.json({
      message: 'その背景にはどのような要因があると思いますか？',
      error: 'API key not configured',
    })
  }

  // リトライ機能
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}: Calling OpenAI API`)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      })

      console.log(`Response status: ${response.status}`)

      if (response.status === 429) {
        console.log('Rate limit hit, waiting...')
        const waitTime = Math.pow(2, attempt) * 1000
        await sleep(waitTime)
        continue
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.choices && data.choices[0] && data.choices[0].message) {
        console.log('Successfully got response from OpenAI')
        return NextResponse.json({ message: data.choices[0].message.content })
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)
      if (attempt === 2) break
      await sleep(1000)
    }
  }

  // フォールバック応答（段階に応じた質問）
  console.log('Using smart fallback response')
  const fallbackMessage = getSmartFallbackResponse(messageCount)
  return NextResponse.json({
    message: fallbackMessage,
    fallback: true,
  })
}
