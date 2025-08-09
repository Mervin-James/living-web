import { useEffect, useMemo, useState } from 'react'
import './index.css'
import Layout from './components/Layout'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import type { AppData, TodoItem, ViewState } from './types'
import { loadFromLocalStorage, parseDataFromQuery, saveToLocalStorage, serializeDataToQuery, sortTodos } from './utils'

const LS_KEY = 'super-do:v1'
const LS_VIEW_KEY = 'super-do:view:v1'

function App() {
  const [items, setItems] = useState<TodoItem[]>([])
  const [view, setView] = useState<ViewState>({ statusFilter: 'all', sortKey: 'dueDate', sortDirection: 'asc' })

  // initial load: URL > localStorage
  useEffect(() => {
    const fromUrl = parseDataFromQuery()
    if (fromUrl) {
      setItems(fromUrl.items)
      return
    }
    const fromLs = loadFromLocalStorage<AppData>(LS_KEY, { version: 1, items: [] })
    setItems(fromLs.items)
    const fromView = loadFromLocalStorage<ViewState>(LS_VIEW_KEY, view)
    setView(fromView)
  }, [])

  // persist
  useEffect(() => {
    const data: AppData = { version: 1, items }
    saveToLocalStorage(LS_KEY, data)
  }, [items])

  // persist view state
  useEffect(() => {
    saveToLocalStorage(LS_VIEW_KEY, view)
  }, [view])

  const visibleItems = useMemo(() => {
    let arr = items
    if (view.statusFilter === 'active') arr = items.filter((i) => !i.done)
    if (view.statusFilter === 'completed') arr = items.filter((i) => i.done)
    arr = sortTodos(arr, view.sortKey, view.sortDirection)
    return arr
  }, [items, view])

  function handleAdd(item: TodoItem) {
    setItems((prev) => [item, ...prev])
  }
  function handleToggle(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)))
  }
  function handleDelete(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }
  function handleMoveUp(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id)
      if (idx <= 0) return prev
      const copy = [...prev]
      ;[copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]]
      return copy
    })
  }
  function handleMoveDown(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id)
      if (idx === -1 || idx >= prev.length - 1) return prev
      const copy = [...prev]
      ;[copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]]
      return copy
    })
  }

  function handleNew() {
    if (confirm('Clear all items?')) setItems([])
  }

  function handleImport(data: AppData) {
    if (!data || typeof data !== 'object' || data.version !== 1 || !Array.isArray(data.items)) {
      alert('Invalid data')
      return
    }
    setItems(data.items)
  }

  function handleExport() {
    const data: AppData = { version: 1, items }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'super-do.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const data: AppData = { version: 1, items }
    const url = serializeDataToQuery(data)
    await navigator.clipboard.writeText(url)
    alert('URL copied to clipboard')
  }

  return (
    <Layout
      title="super-do"
      sideMenu={<TodoForm onAdd={handleAdd} />}
      onNew={handleNew}
      onImport={handleImport}
      onExport={handleExport}
      onShare={handleShare}
      view={view}
      onChangeView={(delta) => setView((v) => ({ ...v, ...delta }))}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Your tasks</h1>
      </div>
      <TodoList items={visibleItems} onToggle={handleToggle} onDelete={handleDelete} onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} />
    </Layout>
  )
}

export default App
