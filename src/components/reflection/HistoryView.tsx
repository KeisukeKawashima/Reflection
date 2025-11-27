import { useState } from 'react'
import { DailyRecord } from '@/lib/types'
import { formatDate, highlightText } from '@/lib/geometry'

interface HistoryViewProps {
  records: DailyRecord[]
  deletingRecord: string | null
  onResumeFromHistory: (record: DailyRecord) => void
  onResumeConversation: (record: DailyRecord) => void
  onDeleteRecord: (date: string) => void
}

export function HistoryView({
  records,
  deletingRecord,
  onResumeFromHistory,
  onResumeConversation,
  onDeleteRecord,
}: HistoryViewProps) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  const filteredRecords = records.filter(record => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      record.items.some((item: any) => item.text.toLowerCase().includes(keyword)) ||
      (record.selectedItem && record.selectedItem.text.toLowerCase().includes(keyword)) ||
      record.chatMessages.some((msg: any) => msg.text.toLowerCase().includes(keyword))
    )
  })

  const groupedRecords = filteredRecords.reduce((groups: any, record) => {
    const yearMonth = record.date.substring(0, 7)
    if (!groups[yearMonth]) {
      groups[yearMonth] = []
    }
    groups[yearMonth].push(record)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800">過去の振り返り</h2>
        <p className="mb-6 text-gray-600">これまでの記録を見返してみましょう</p>

        <div className="mx-auto max-w-md">
          <input
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none"
            placeholder="記録を検索..."
          />
        </div>
      </div>

      {Object.keys(groupedRecords).length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            {searchKeyword ? '検索結果が見つかりません' : 'まだ記録がありません'}
          </p>
        </div>
      ) : (
        Object.keys(groupedRecords)
          .sort((a, b) => b.localeCompare(a))
          .map(yearMonth => (
            <div key={yearMonth} className="space-y-3">
              <h3 className="border-b border-gray-200 pb-2 text-base font-semibold text-gray-700">
                {formatDate(yearMonth + '-01', { year: 'numeric', month: 'long' })}
              </h3>

              {groupedRecords[yearMonth]
                .sort((a: any, b: any) => b.date.localeCompare(a.date))
                .map((record: any) => (
                  <div
                    key={record.date}
                    className={`duration-800 ml-4 rounded-lg border border-gray-200 bg-white p-5 transition-all ${
                      deletingRecord === record.date
                        ? 'translate-x-full scale-95 transform opacity-0'
                        : 'scale-100 opacity-100'
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-800">
                        {formatDate(record.date, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onResumeFromHistory(record)}
                          disabled={deletingRecord === record.date}
                          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                        >
                          振り返りを再開
                        </button>
                        {record.selectedItem &&
                          record.chatMessages &&
                          record.chatMessages.length > 1 && (
                            <button
                              onClick={() => onResumeConversation(record)}
                              disabled={deletingRecord === record.date}
                              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                            >
                              会話を再開
                            </button>
                          )}
                        <button
                          onClick={() => setShowDeleteModal(record.date)}
                          disabled={deletingRecord === record.date}
                          className="group relative rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          title="削除"
                        >
                          {deletingRecord === record.date ? (
                            <span className="flex items-center text-xs">
                              <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent"></div>
                              削除中...
                            </span>
                          ) : (
                            <>
                              <span className="group-hover:hidden">🗑️</span>
                              <span className="hidden group-hover:inline">削除</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h5 className="mb-2 text-xs font-medium text-green-700">良かったこと</h5>
                        {(record.items || [])
                          .filter((item: any) => item.type === 'good')
                          .map((item: any) => (
                            <p
                              key={item.id}
                              className="mb-1 rounded border border-green-200 bg-green-50 p-2 text-xs text-gray-700"
                            >
                              {searchKeyword &&
                              item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(item.text, searchKeyword),
                                  }}
                                />
                              ) : (
                                item.text
                              )}
                            </p>
                          ))}
                      </div>
                      <div>
                        <h5 className="mb-2 text-xs font-medium text-blue-700">改善したいこと</h5>
                        {(record.items || [])
                          .filter((item: any) => item.type === 'growth')
                          .map((item: any) => (
                            <p
                              key={item.id}
                              className="mb-1 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-gray-700"
                            >
                              {searchKeyword &&
                              item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(item.text, searchKeyword),
                                  }}
                                />
                              ) : (
                                item.text
                              )}
                            </p>
                          ))}
                      </div>
                    </div>

                    {(record.items || []).filter((item: any) => item.type === 'insight').length >
                      0 && (
                      <div className="mb-4">
                        <h5 className="mb-2 text-xs font-medium text-purple-700">気づき</h5>
                        <div className="space-y-1">
                          {(record.items || [])
                            .filter((item: any) => item.type === 'insight')
                            .map((item: any) => (
                              <p
                                key={item.id}
                                className="rounded border border-purple-200 bg-purple-50 p-2 text-xs text-gray-700"
                              >
                                {searchKeyword &&
                                item.text.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(item.text, searchKeyword),
                                    }}
                                  />
                                ) : (
                                  item.text
                                )}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}

                    {record.selectedItem && (
                      <div className="border-t border-gray-200 pt-4">
                        <h5 className="mb-2 text-xs font-medium text-gray-700">選択したトピック</h5>
                        <p className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700">
                          {searchKeyword &&
                          record.selectedItem.text
                            .toLowerCase()
                            .includes(searchKeyword.toLowerCase()) ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightText(record.selectedItem.text, searchKeyword),
                              }}
                            />
                          ) : (
                            record.selectedItem.text
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <span className="text-xl">🗑️</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">記録の削除</h3>
              <p className="mb-2 text-sm text-gray-600">
                {formatDate(showDeleteModal, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
              <p className="mb-6 text-sm text-gray-700">
                この日の記録を削除しますか？
                <br />
                <span className="text-red-600">削除すると元に戻せません</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    onDeleteRecord(showDeleteModal)
                    setShowDeleteModal(null)
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
