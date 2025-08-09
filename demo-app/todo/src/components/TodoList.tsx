import type { TodoItem } from '../types'
import { formatDateDisplay } from '../utils'

interface TodoListProps {
  items: TodoItem[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export default function TodoList({ items, onToggle, onDelete, onMoveUp, onMoveDown }: TodoListProps) {
  if (items.length === 0) {
    return <div className="text-gray-500">No items</div>
  }
  return (
    <ul className="grid gap-3">
      {items.map((item, idx) => (
        <li key={item.id} className={`border rounded-xl bg-white p-3 flex justify-between gap-3 ${item.done ? 'opacity-70' : ''}`}>
          <div className="flex gap-3 items-start">
            <input type="checkbox" className="mt-1 size-4" checked={item.done} onChange={() => onToggle(item.id)} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item.title}</span>
                {item.priority !== 'none' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                    item.priority === 'low' ? 'bg-cyan-50' : item.priority === 'medium' ? 'bg-amber-50' : 'bg-rose-50'
                  }`}>{item.priority}</span>
                )}
              </div>
              {item.notes && <div className="text-gray-600 text-sm">{item.notes}</div>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                {item.dueDate && <span>Due: {formatDateDisplay(item.dueDate)}</span>}
                {item.assignee && <span>@{item.assignee}</span>}
                {item.link && (
                  <a className="underline hover:text-gray-800" href={item.link} target="_blank" rel="noreferrer">
                    link
                  </a>
                )}
                {item.tags.length > 0 && (
                  <span className="flex gap-1 flex-wrap">
                    {item.tags.map((t) => (
                      <span className="px-2 py-0.5 rounded-full border" key={t}>
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-40" disabled={idx === 0} onClick={() => onMoveUp(item.id)} data-destination="true">
              ↑
            </button>
            <button className="px-2 py-1 border rounded disabled:opacity-40" disabled={idx === items.length - 1} onClick={() => onMoveDown(item.id)} data-destination="true">
              ↓
            </button>
            <button className="px-2 py-1 border rounded" onClick={() => onDelete(item.id)} data-destination="true">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  )
}

