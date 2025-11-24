import { ReflectionItem } from '@/lib/types'

interface TopicSelectorProps {
  items: ReflectionItem[]
  onSelectTopic: (item: ReflectionItem) => void
  onBack: () => void
}

export function TopicSelector({ items, onSelectTopic, onBack }: TopicSelectorProps) {
  const filledItems = items.filter(item => item.text.trim())

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-xl font-medium text-gray-900">どれについて深く考えてみますか？</h2>
        <p className="text-sm text-gray-500">一つ選んでAIと対話してみましょう</p>
      </div>

      <div className="space-y-2">
        {filledItems.map(item => (
          <div
            key={item.id}
            onClick={() => onSelectTopic(item)}
            className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="mr-4 flex-1">
                <div className="mb-1 flex items-center">
                  <span
                    className={`mr-2 text-xs font-medium ${
                      item.type === 'good' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    {item.type === 'good' ? '✓' : '→'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.type === 'good' ? '良かったこと' : '改善したいこと'}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{item.text}</p>
              </div>
              <svg
                className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400 transition-colors group-hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={onBack}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          ← 戻る
        </button>
      </div>
    </div>
  )
}
