import { useState, useCallback } from 'react'
import { ReflectionItem } from '@/lib/types'

export function useReflectionItems() {
  const [items, setItems] = useState<ReflectionItem[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<ReflectionItem | null>(null)

  const addItem = useCallback((type: 'good' | 'growth' | 'insight') => {
    const newItem: ReflectionItem = {
      id: Date.now().toString(),
      text: '',
      type,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
    }
    setItems(prev => [...prev, newItem])
  }, [])

  const updateItem = useCallback((id: string, text: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, text } : item)))
  }, [])

  const moveItem = useCallback((id: string, x: number, y: number) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, x, y } : item)))
  }, [])

  const deleteItem = useCallback(
    (id: string) => {
      setItems(prev => prev.filter(item => item.id !== id))
      if (selectedItem === id) {
        setSelectedItem(null)
      }
    },
    [selectedItem]
  )

  const copyItem = useCallback(
    (id: string) => {
      const item = items.find(i => i.id === id)
      if (!item) return

      const newItem: ReflectionItem = {
        id: Date.now().toString(),
        text: item.text,
        type: item.type,
        x: item.x + 20,
        y: item.y + 20,
      }
      setItems(prev => [...prev, newItem])
    },
    [items]
  )

  return {
    items,
    setItems,
    selectedItem,
    setSelectedItem,
    copiedItem,
    setCopiedItem,
    addItem,
    updateItem,
    moveItem,
    deleteItem,
    copyItem,
  }
}
