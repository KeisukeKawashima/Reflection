import { COLORS } from '@/lib/constants'

interface ToolbarProps {
  onAddGood: () => void
  onAddGrowth: () => void
  onAddInsight: () => void
}

export function Toolbar({ onAddGood, onAddGrowth, onAddInsight }: ToolbarProps) {
  return (
    <div className="fixed left-6 top-1/2 z-20 flex -translate-y-1/2 transform flex-col space-y-2">
      <button
        onClick={onAddGood}
        className={`group flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg`}
        title="良かったこと"
      >
        <div
          className={`h-8 w-8 rounded-lg ${COLORS.GOOD.bg} mr-3 flex items-center justify-center ${COLORS.GOOD.hover} transition-colors`}
        >
          <svg
            className="h-4 w-4 text-green-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-700">良かったこと</span>
      </button>

      <button
        onClick={onAddGrowth}
        className={`group flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg`}
        title="改善したいこと"
      >
        <div
          className={`h-8 w-8 rounded-lg ${COLORS.GROWTH.bg} mr-3 flex items-center justify-center ${COLORS.GROWTH.hover} transition-colors`}
        >
          <svg
            className="h-4 w-4 text-blue-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-700">改善したいこと</span>
      </button>

      <button
        onClick={onAddInsight}
        className={`group flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg`}
        title="今日の気づき"
      >
        <div
          className={`h-8 w-8 rounded-lg ${COLORS.INSIGHT.bg} mr-3 flex items-center justify-center ${COLORS.INSIGHT.hover} transition-colors`}
        >
          <svg
            className="h-4 w-4 text-yellow-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-gray-700">今日の気づき</span>
      </button>
    </div>
  )
}
