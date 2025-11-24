import { useState, useCallback, useEffect } from 'react'
import { DailyRecord } from '@/lib/types'
import { ANIMATION } from '@/lib/constants'

export function useRecords() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null)

  const loadRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/reflections')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }, [])

  const saveRecord = useCallback(
    async (date: string, items: any[], selectedItem: any, chatMessages: any[]) => {
      try {
        await fetch('/api/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            items: items.filter(item => item.text.trim()),
            selectedItem,
            chatMessages,
          }),
        })
      } catch (error) {
        console.error('Failed to save record:', error)
      }
    },
    []
  )

  const deleteRecord = useCallback(async (date: string) => {
    setDeletingRecord(date)

    try {
      await new Promise(resolve => setTimeout(resolve, ANIMATION.DELETE_ANIMATION))
      await fetch(`/api/reflections/${date}`, { method: 'DELETE' })
      setRecords(prev => prev.filter(r => r.date !== date))
    } catch (error) {
      console.error('Failed to delete record:', error)
    } finally {
      setDeletingRecord(null)
    }
  }, [])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  return {
    records,
    deletingRecord,
    loadRecords,
    saveRecord,
    deleteRecord,
  }
}
