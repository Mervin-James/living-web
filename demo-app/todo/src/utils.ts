import type { AppData, TodoItem } from './types'

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function serializeDataToQuery(data: AppData): string {
  const json = JSON.stringify(data)
  const encoded = encodeURIComponent(json)
  const url = new URL(window.location.href)
  url.searchParams.set('data', encoded)
  url.hash = ''
  return url.toString()
}

export function parseDataFromQuery(): AppData | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('data')
    if (!encoded) return null
    const json = decodeURIComponent(encoded)
    const parsed = JSON.parse(json) as AppData
    return parsed
  } catch {
    return null
  }
}

export function normalizeTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function formatDateDisplay(value: string | null): string {
  if (!value) return ''
  return value
}

export function sortTodos(items: TodoItem[], key: 'dueDate' | 'status', dir: 'asc' | 'desc'): TodoItem[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    if (key === 'status') {
      const aVal = a.done ? 1 : 0
      const bVal = b.done ? 1 : 0
      return (aVal - bVal) * factor
    }
    // dueDate: nulls last
    const aVal = a.dueDate ?? '9999-12-31'
    const bVal = b.dueDate ?? '9999-12-31'
    if (aVal < bVal) return -1 * factor
    if (aVal > bVal) return 1 * factor
    return 0
  })
}

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

