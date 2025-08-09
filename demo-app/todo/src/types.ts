export type TodoPriority = 'none' | 'low' | 'medium' | 'high'

export interface TodoItem {
  id: string
  title: string
  notes: string
  dueDate: string | null // YYYY-MM-DD or null
  assignee: string
  link: string
  done: boolean
  priority: TodoPriority
  tags: string[]
  createdAt: number
}

export type StatusFilter = 'all' | 'active' | 'completed'

export type SortKey = 'dueDate' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface ViewState {
  statusFilter: StatusFilter
  sortKey: SortKey
  sortDirection: SortDirection
}

export interface AppDataV1 {
  version: 1
  items: TodoItem[]
}

export type AppData = AppDataV1

